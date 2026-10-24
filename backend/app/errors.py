class DomainError(Exception):
    """Business failures mapped to HTTP at the application boundary."""
    def __init__(self, status: int, message: str):
        self.status = status
        self.message = message
        super().__init__(message)
