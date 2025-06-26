import logging
from datetime import datetime
from typing import Any, Dict, Optional

from api.models import CalendarTask  # ИЗМЕНЕНО: Импортируем CalendarTask вместо Task
from django.contrib.auth import get_user_model
from django.utils import timezone

logger = logging.getLogger(__name__)
User = get_user_model()  # CustomUser

# JSON Schema для инструмента создания задачи (адаптировано для CalendarTask)
CREATE_TASK_TOOL_SCHEMA = {
    "type": "function",
    "function": {
        "name": "create_task_tool",
        "description": "Creates a new calendar task in the system. Allows specifying title, description, deadline, and priority.",
        "parameters": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "The title of the calendar task. This is a required field."},
                "description": {
                    "type": "string",
                    "description": "A detailed description of the calendar task. Optional.",
                },
                "deadline": {  # ИЗМЕНЕНО: было due_date
                    "type": "string",
                    "description": "The deadline for the calendar task in YYYY-MM-DD format. Optional.",
                },
                "priority": {
                    "type": "string",
                    "description": "The priority of the calendar task. Allowed values: 'low', 'medium', 'high'. Defaults to 'medium' if not specified. Optional.",
                    "enum": ["low", "medium", "high"],
                },
                # УДАЛЕНО: assignee_email, так как CalendarTask не имеет явного поля assignee, используется created_by
            },
            "required": ["title"],  # assignee_email удален из required, если он там был
        },
    },
}

# Список всех доступных инструментов
AVAILABLE_TOOLS = [CREATE_TASK_TOOL_SCHEMA]


def create_task_tool(
    title: str,
    requesting_user: User,  # ДОБАВЛЕНО: пользователь, делающий запрос
    description: Optional[str] = None,
    deadline: Optional[str] = None,  # ИЗМЕНЕНО: было due_date
    priority: Optional[str] = "medium",
    # УДАЛЕНО: assignee_email
) -> Dict[str, Any]:
    """
    Creates a calendar task using Django ORM, assigning it to the requesting user.
    Returns a dictionary with the result.
    """
    logger.info(f"Attempting to create calendar task with title: '{title}' by user '{requesting_user.email}'")

    # Handle potentially null or empty description
    if not description:  # Handles None or empty string
        logger.info(f"Description not provided for task '{title}'. Using title as description.")
        description = title

    try:
        # Валидация приоритета (CalendarTask.PRIORITY_CHOICES может отличаться, но значения 'low', 'medium', 'high' обычно совпадают)
        # Предполагаем, что CalendarTask.PRIORITY_CHOICES хранит значения 'low', 'medium', 'high'
        # Если нет, эту валидацию нужно будет адаптировать или убедиться, что модель ее выполняет.
        valid_priorities_in_model = [choice[0] for choice in CalendarTask.PRIORITY_CHOICES]
        if priority not in valid_priorities_in_model and priority is not None:
            logger.warning(
                f"Invalid priority '{priority}' provided for CalendarTask. Defaulting to 'medium'. Allowed: {valid_priorities_in_model}"
            )
            priority = "medium"

        new_task_data = {
            "title": title,
            "description": description,
            "priority": priority or "medium",
            "created_by": requesting_user,  # ИСПОЛЬЗУЕМ requesting_user
            # "type": "other" # Поле type в CalendarTask по умолчанию 'other', можно оставить так или добавить параметр в инструмент
        }

        if deadline:
            try:
                # Attempt to extract just the date part if there's extra text
                date_part = deadline.split(" ")[0]
                parsed_dt = datetime.strptime(date_part, "%Y-%m-%d")
                aware_dt = timezone.make_aware(parsed_dt, timezone.get_current_timezone())
                new_task_data["deadline"] = aware_dt  # ИЗМЕНЕНО: поле deadline
                logger.info(f"Parsed deadline '{deadline}' (extracted '{date_part}') to aware datetime '{aware_dt}'")
            except ValueError:
                logger.error(
                    f"Invalid date format for deadline: '{deadline}'. Could not parse '{date_part}'. CalendarTask will be created without a deadline."
                )

        logger.debug(f"Preparing to create CalendarTask with data: {new_task_data}")
        task = CalendarTask.objects.create(**new_task_data)  # ИЗМЕНЕНО: CalendarTask.objects.create
        logger.info(
            f"CalendarTask '{task.title}' (ID: {task.id}) created successfully by user '{requesting_user.email}'."
        )

        return {
            "status": "success",
            "message": f"CalendarTask '{task.title}' created successfully with ID {task.id}.",
            "task_id": task.id,
            "title": task.title,
            "created_by": requesting_user.email,
        }
    except Exception as e:
        logger.exception(
            f"Failed to create CalendarTask '{title}' by user '{requesting_user.email}'"
        )  # Добавлено .exception для трассировки
        return {"status": "error", "message": f"Failed to create CalendarTask: {str(e)}"}


# Словарь для вызова функций инструментов по их имени
TOOL_FUNCTIONS = {"create_task_tool": create_task_tool}
