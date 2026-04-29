from rest_framework import serializers
from .models import Task, CalendarEvent
from accounts.serializers import UserSerializer

class TaskSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    assigned_to_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'completed_at']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

class CalendarEventSerializer(serializers.ModelSerializer):
    attendees = UserSerializer(many=True, read_only=True)
    attendee_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, source='attendees',
        queryset=__import__('accounts.models', fromlist=['User']).User.objects.all(), required=False)
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = CalendarEvent
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
