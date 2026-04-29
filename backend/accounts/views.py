import logging
import threading
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.cache import cache
from django.utils import timezone
from .models import User
from .serializers import (UserSerializer, UserCreateSerializer,
                           ChangePasswordSerializer, ProfileUpdateSerializer)
from .permissions import IsAdmin, IsManagerOrAbove
from rest_framework import serializers as drf_serializers

logger = logging.getLogger('crm')


def _check_login_rate(identifier):
    """Simple in-memory rate limiter — 5 attempts per minute per IP/username."""
    key = f'login_attempts:{identifier}'
    attempts = cache.get(key, 0)
    if attempts >= 5:
        return False
    cache.set(key, attempts + 1, timeout=60)
    return True


class LoginSerializer(drf_serializers.Serializer):
    username = drf_serializers.CharField()
    password = drf_serializers.CharField(write_only=True)


class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserCreateSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        logger.info('New user registered: %s', request.data.get('username'))
        return response


class LoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        ip = request.META.get('REMOTE_ADDR', 'unknown')
        username = request.data.get('username', '')

        # Rate limiting: block after 5 failed attempts per minute per IP
        if not _check_login_rate(ip):
            logger.warning('Login rate limit exceeded for IP %s', ip)
            return Response(
                {'error': 'Too many login attempts. Please wait a minute.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        user = authenticate(username=username, password=request.data.get('password'))
        if not user:
            logger.warning('Failed login attempt for username=%s from IP=%s', username, ip)
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        if not user.is_active:
            return Response({'error': 'Account is disabled'}, status=status.HTTP_403_FORBIDDEN)

        # Reset attempts on success
        cache.delete(f'login_attempts:{ip}')
        refresh = RefreshToken.for_user(user)
        logger.info('User %s logged in from IP=%s', user.username, ip)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })


class LogoutView(generics.GenericAPIView):
    def post(self, request):
        try:
            token = RefreshToken(request.data.get('refresh'))
            token.blacklist()
            logger.info('User %s logged out', request.user.username)
            return Response({'message': 'Logged out successfully'})
        except Exception:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def put(self, request, *args, **kwargs):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)

    patch = put


class ChangePasswordView(generics.GenericAPIView):
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'error': 'Old password is incorrect'}, status=400)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        logger.info('User %s changed their password', user.username)
        return Response({'message': 'Password changed successfully'})


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response({'is_active': user.is_active})

    @action(detail=False, methods=['get'])
    def agents(self, request):
        """Return list of all agents (useful for assignment dropdowns)."""
        agents = User.objects.filter(role=User.Role.AGENT, is_active=True)
        return Response(UserSerializer(agents, many=True).data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """User count stats by role."""
        from django.db.models import Count
        data = User.objects.values('role').annotate(count=Count('id'))
        return Response(list(data))
