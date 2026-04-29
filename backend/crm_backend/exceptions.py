import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('crm')


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        errors = response.data
        if isinstance(errors, dict):
            flat = []
            for field, msgs in errors.items():
                if isinstance(msgs, list):
                    for m in msgs:
                        flat.append(f"{field}: {m}" if field != 'non_field_errors' else str(m))
                else:
                    flat.append(str(msgs))
            response.data = {
                'success': False,
                'errors': flat,
                'detail': errors,
            }
        else:
            response.data = {'success': False, 'errors': [str(errors)]}
    else:
        logger.exception("Unhandled exception in %s", context.get('view'))
        response = Response(
            {'success': False, 'errors': ['An unexpected error occurred. Please try again.']},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response
