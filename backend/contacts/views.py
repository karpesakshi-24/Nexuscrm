from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
import csv, io
from django.http import HttpResponse
from .models import Contact, Tag, ActivityLog
from .serializers import (ContactListSerializer, ContactDetailSerializer,
                           TagSerializer, ActivityLogSerializer)
from accounts.permissions import IsManagerOrAbove

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

class ContactViewSet(viewsets.ModelViewSet):
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'email', 'company', 'phone']
    ordering_fields = ['created_at', 'first_name', 'last_name', 'company', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Contact.objects.select_related('assigned_to', 'created_by').prefetch_related('tags')
        # Agents only see their assigned contacts
        if not user.is_manager:
            qs = qs.filter(Q(assigned_to=user) | Q(created_by=user))
        # Filters from query params
        status_filter = self.request.query_params.get('status')
        source_filter = self.request.query_params.get('source')
        tag_filter = self.request.query_params.get('tag')
        assigned_filter = self.request.query_params.get('assigned_to')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if source_filter:
            qs = qs.filter(source=source_filter)
        if tag_filter:
            qs = qs.filter(tags__name=tag_filter)
        if assigned_filter:
            qs = qs.filter(assigned_to_id=assigned_filter)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return ContactListSerializer
        return ContactDetailSerializer

    @action(detail=True, methods=['post'])
    def add_activity(self, request, pk=None):
        contact = self.get_object()
        serializer = ActivityLogSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(contact=contact, user=request.user)
        return Response(serializer.data, status=201)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        contacts = self.get_queryset()
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="contacts.csv"'
        writer = csv.writer(response)
        writer.writerow(['Name', 'Email', 'Phone', 'Company', 'Status', 'Source', 'City', 'Country', 'Created'])
        for c in contacts:
            writer.writerow([c.full_name, c.email, c.phone, c.company,
                              c.status, c.source, c.city, c.country, c.created_at.date()])
        return response

    @action(detail=False, methods=['post'], permission_classes=[IsManagerOrAbove])
    def import_csv(self, request):
        csv_file = request.FILES.get('file')
        if not csv_file:
            return Response({'error': 'No file provided'}, status=400)
        decoded = csv_file.read().decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded))
        created, skipped = 0, 0
        for row in reader:
            email = row.get('email', '').strip()
            if not email:
                skipped += 1
                continue
            _, was_created = Contact.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': row.get('first_name', ''),
                    'last_name': row.get('last_name', ''),
                    'company': row.get('company', ''),
                    'phone': row.get('phone', ''),
                    'created_by': request.user,
                }
            )
            if was_created:
                created += 1
            else:
                skipped += 1
        return Response({'created': created, 'skipped': skipped})
