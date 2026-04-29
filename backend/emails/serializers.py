from rest_framework import serializers
from .models import EmailTemplate, EmailThread, EmailMessage
from accounts.serializers import UserSerializer

class EmailMessageSerializer(serializers.ModelSerializer):
    sent_by = UserSerializer(read_only=True)
    class Meta:
        model = EmailMessage
        fields = '__all__'
        read_only_fields = ['sent_by', 'sent_at', 'message_id']

class EmailThreadSerializer(serializers.ModelSerializer):
    messages = EmailMessageSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    message_count = serializers.IntegerField(source='messages.count', read_only=True)

    class Meta:
        model = EmailThread
        fields = ['id', 'subject', 'contact', 'messages', 'last_message',
                  'message_count', 'created_at', 'updated_at']

    def get_last_message(self, obj):
        msg = obj.messages.last()
        return EmailMessageSerializer(msg).data if msg else None

class EmailTemplateSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    class Meta:
        model = EmailTemplate
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']
