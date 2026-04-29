from rest_framework import serializers
from .models import Pipeline, Stage, Deal, DealNote
from accounts.serializers import UserSerializer


class StageSerializer(serializers.ModelSerializer):
    deal_count = serializers.IntegerField(read_only=True)
    total_value = serializers.DecimalField(max_digits=16, decimal_places=2, read_only=True)

    class Meta:
        model = Stage
        fields = ['id', 'pipeline', 'name', 'order', 'color', 'probability',
                  'deal_count', 'total_value']
        read_only_fields = ['deal_count', 'total_value']


class PipelineSerializer(serializers.ModelSerializer):
    stages = StageSerializer(many=True, read_only=True)
    deal_count = serializers.IntegerField(read_only=True)
    total_value = serializers.DecimalField(max_digits=16, decimal_places=2, read_only=True)

    class Meta:
        model = Pipeline
        fields = ['id', 'name', 'description', 'is_default', 'stages',
                  'deal_count', 'total_value', 'created_at']
        read_only_fields = ['created_at']


class DealNoteSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = DealNote
        fields = ['id', 'content', 'created_by', 'created_at']
        read_only_fields = ['created_by', 'created_at']


class DealSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    assigned_to_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    created_by = UserSerializer(read_only=True)
    stage_name = serializers.CharField(source='stage.name', read_only=True)
    pipeline_name = serializers.CharField(source='pipeline.name', read_only=True)
    contact_name = serializers.SerializerMethodField()
    notes = DealNoteSerializer(many=True, read_only=True)

    class Meta:
        model = Deal
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'closed_at']

    def get_contact_name(self, obj):
        return obj.contact.full_name if obj.contact else None

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class DealListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    stage_name = serializers.CharField(source='stage.name', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    contact_name = serializers.SerializerMethodField()

    class Meta:
        model = Deal
        fields = ['id', 'title', 'value', 'currency', 'priority', 'status',
                  'stage', 'stage_name', 'pipeline', 'pipeline_name',
                  'assigned_to_name', 'contact_name', 'expected_close_date', 'created_at']

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None

    def get_contact_name(self, obj):
        return obj.contact.full_name if obj.contact else None

    pipeline_name = serializers.CharField(source='pipeline.name', read_only=True)
