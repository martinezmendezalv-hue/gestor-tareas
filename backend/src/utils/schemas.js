// Álvaro Martínez
const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.email('Email no válido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

const loginSchema = z.object({
  email: z.email('Email no válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

const teamSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
});

const memberSchema = z.object({
  email: z.email('Email no válido'),
});

const taskSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional().default(''),
  status: z.enum(['pendiente', 'en_curso', 'hecha']).optional(),
  assigned_to: z.number().int().positive().nullable().optional(),
});

module.exports = { registerSchema, loginSchema, teamSchema, memberSchema, taskSchema };
