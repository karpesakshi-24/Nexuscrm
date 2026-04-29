from rest_framework import serializers
from .models import Contact, Tag, ActivityLog
from accounts.serializers import UserSerializer

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color']

class ActivityLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = ActivityLog
        fields = ['id', 'activity_type', 'title', 'description', 'user', 'created_at']
        read_only_fields = ['user', 'created_at']

class ContactListSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    assigned_to = UserSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)
    class Meta:
        model = Contact
        fields = ['id', 'full_name', 'first_name', 'last_name', 'email',
                  'phone', 'company', 'job_title', 'status', 'source',
                  'assigned_to', 'tags', 'city', 'country', 'created_at']

class ContactDetailSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), many=True, write_only=True, source='tags', required=False)
    assigned_to = UserSerializer(read_only=True)
    assigned_to_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    activities = ActivityLogSerializer(many=True, read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Contact
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
