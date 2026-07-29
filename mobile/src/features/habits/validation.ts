import { CreateHabitRequest, ScheduleType } from '../../types/api';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const REMINDER_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export type HabitFormValues = {
  name: string;
  description: string;
  icon: string;
  color: string;
  scheduleType: ScheduleType;
  scheduleDays: number;
  reminderEnabled: boolean;
  reminderTime: string;
};

export type HabitFieldErrors = {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  scheduleDays?: string;
  reminderTime?: string;
};

export function validateHabitForm(values: HabitFormValues): HabitFieldErrors {
  const errors: HabitFieldErrors = {};
  const trimmedName = values.name.trim();

  if (!trimmedName) {
    errors.name = 'El nombre es obligatorio';
  } else if (trimmedName.length > 60) {
    errors.name = 'El nombre debe tener como máximo 60 caracteres';
  }

  if (values.description.length > 250) {
    errors.description = 'La descripción debe tener como máximo 250 caracteres';
  }

  if (!values.icon) {
    errors.icon = 'Elige un ícono';
  }

  if (!HEX_COLOR.test(values.color)) {
    errors.color = 'El color debe ser un hex #RRGGBB';
  }

  if (values.scheduleType === ScheduleType.SpecificDays) {
    if (values.scheduleDays < 1 || values.scheduleDays > 127) {
      errors.scheduleDays = 'Selecciona al menos un día';
    }
  }

  if (values.reminderEnabled) {
    if (!REMINDER_TIME.test(values.reminderTime)) {
      errors.reminderTime = 'La hora debe tener formato HH:mm';
    }
  }

  return errors;
}

export function isHabitFormValid(values: HabitFormValues): boolean {
  return Object.keys(validateHabitForm(values)).length === 0;
}

export function toHabitRequest(values: HabitFormValues): CreateHabitRequest {
  const description = values.description.trim();

  return {
    name: values.name.trim(),
    description: description.length > 0 ? description : null,
    icon: values.icon,
    color: values.color,
    scheduleType: values.scheduleType,
    scheduleDays:
      values.scheduleType === ScheduleType.SpecificDays ? values.scheduleDays : null,
    reminderTime: values.reminderEnabled ? values.reminderTime : null,
  };
}
