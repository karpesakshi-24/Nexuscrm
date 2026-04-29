"""Helpers to create notifications from anywhere in the codebase."""
import threading
from .models import Notification


def _create(recipient, notification_type, title, message, link=''):
    Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        link=link,
    )


def notify(recipient, notification_type, title, message, link=''):
    """Create a notification asynchronously."""
    t = threading.Thread(
        target=_create,
        args=(recipient, notification_type, title, message, link),
        daemon=True,
    )
    t.start()


def notify_task_assigned(task):
    if task.assigned_to and task.assigned_to != task.created_by:
        notify(
            task.assigned_to,
            Notification.Type.TASK_ASSIGNED,
            f'New task assigned: {task.title}',
            f'You have been assigned a task. Priority: {task.priority}',
            link=f'/tasks/{task.pk}',
        )


def notify_deal_won(deal):
    if deal.assigned_to:
        notify(
            deal.assigned_to,
            Notification.Type.DEAL_WON,
            f'🎉 Deal Won: {deal.title}',
            f'Congratulations! Deal worth {deal.currency} {deal.value} has been marked as won.',
            link=f'/pipeline/deals/{deal.pk}',
        )


def notify_deal_lost(deal):
    if deal.assigned_to:
        notify(
            deal.assigned_to,
            Notification.Type.DEAL_LOST,
            f'Deal Lost: {deal.title}',
            f'Deal worth {deal.currency} {deal.value} has been marked as lost. Reason: {deal.lost_reason or "N/A"}',
            link=f'/pipeline/deals/{deal.pk}',
        )
