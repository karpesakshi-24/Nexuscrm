import logging
import threading
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from .models import EmailTemplate, EmailThread, EmailMessage
from .serializers import EmailTemplateSerializer, EmailThreadSerializer, EmailMessageSerializer

logger = logging.getLogger('crm')


def _send_async(subject, body_text, body_html, from_email, to_emails):
    """Send email in a background thread so the API response is not blocked."""
    def _worker():
        try:
            if body_html:
                msg = EmailMultiAlternatives(subject, body_text, from_email, to_emails)
                msg.attach_alternative(body_html, 'text/html')
                msg.send()
            else:
                send_mail(subject, body_text, from_email, to_emails, fail_silently=False)
            logger.info('Email sent to %s | subject: %s', to_emails, subject)
        except Exception as exc:
            logger.error('Async email failed to %s: %s', to_emails, exc)

    t = threading.Thread(target=_worker, daemon=True)
    t.start()


class EmailTemplateViewSet(viewsets.ModelViewSet):
    queryset = EmailTemplate.objects.all().order_by('-created_at')
    serializer_class = EmailTemplateSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'subject']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def preview(self, request, pk=None):
        """Return template with variable substitution applied."""
        template = self.get_object()
        variables = request.data.get('variables', {})
        subject = template.subject
        body = template.body
        for key, val in variables.items():
            subject = subject.replace(f'{{{{{key}}}}}', str(val))
            body = body.replace(f'{{{{{key}}}}}', str(val))
        return Response({'subject': subject, 'body': body})


class EmailThreadViewSet(viewsets.ModelViewSet):
    serializer_class = EmailThreadSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['subject', 'contact__first_name', 'contact__last_name', 'contact__email']
    ordering_fields = ['updated_at', 'created_at']

    def get_queryset(self):
        qs = EmailThread.objects.prefetch_related('messages__sent_by').select_related('contact')
        contact_id = self.request.query_params.get('contact')
        if contact_id:
            qs = qs.filter(contact_id=contact_id)
        return qs

    @action(detail=True, methods=['post'])
    def send_reply(self, request, pk=None):
        thread = self.get_object()
        to_emails = request.data.get('to_emails', [])
        body_text = request.data.get('body', '')
        body_html = request.data.get('body_html', '')
        subject = request.data.get('subject', f'Re: {thread.subject}')

        if not to_emails:
            return Response({'error': 'to_emails is required'}, status=400)

        _send_async(subject, body_text, body_html, settings.DEFAULT_FROM_EMAIL, to_emails)

        msg = EmailMessage.objects.create(
            thread=thread,
            direction=EmailMessage.Direction.OUTBOUND,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to_emails=to_emails,
            subject=subject,
            body_text=body_text,
            body_html=body_html,
            sent_by=request.user,
        )
        thread.save()  # bump updated_at
        return Response(EmailMessageSerializer(msg).data, status=201)

    @action(detail=False, methods=['post'])
    def compose(self, request):
        contact_id = request.data.get('contact_id')
        to_emails = request.data.get('to_emails', [])
        subject = request.data.get('subject', '')
        body_text = request.data.get('body', '')
        body_html = request.data.get('body_html', '')
        template_id = request.data.get('template_id')

        if not to_emails or not subject:
            return Response({'error': 'to_emails and subject are required'}, status=400)

        # Apply template if provided
        if template_id:
            try:
                tmpl = EmailTemplate.objects.get(pk=template_id)
                variables = request.data.get('variables', {})
                body_text = tmpl.body
                for k, v in variables.items():
                    body_text = body_text.replace(f'{{{{{k}}}}}', str(v))
            except EmailTemplate.DoesNotExist:
                pass

        _send_async(subject, body_text, body_html, settings.DEFAULT_FROM_EMAIL, to_emails)

        thread = EmailThread.objects.create(subject=subject, contact_id=contact_id)
        EmailMessage.objects.create(
            thread=thread,
            direction=EmailMessage.Direction.OUTBOUND,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to_emails=to_emails,
            subject=subject,
            body_text=body_text,
            body_html=body_html,
            sent_by=request.user,
        )
        return Response(EmailThreadSerializer(thread).data, status=201)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        thread = self.get_object()
        thread.messages.filter(is_read=False, direction='inbound').update(is_read=True)
        return Response({'status': 'marked as read'})
