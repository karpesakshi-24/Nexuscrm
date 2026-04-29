import time
import logging

logger = logging.getLogger('crm')


class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.time()
        response = self.get_response(request)
        duration_ms = int((time.time() - start) * 1000)
        if request.path.startswith('/api/'):
            user = getattr(request, 'user', None)
            uid = user.id if user and user.is_authenticated else 'anon'
            logger.info(
                '%s %s → %s (%dms) [user=%s]',
                request.method, request.path, response.status_code, duration_ms, uid
            )
        return response
