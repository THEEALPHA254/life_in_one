import { z } from "zod";

export const budgetKindSchema = z.enum(["income", "expense", "savings"]);

export const budgetCategorySchema = z.object({
  name: z.string().min(1).max(60),
  kind: budgetKindSchema,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const budgetTransactionSchema = z.object({
  category_id: z.string().uuid().nullable().optional(),
  amount_cents: z.number().int(),
  currency: z.string().length(3).default("KES"),
  occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(200).optional(),
});

export type BudgetCategoryInput = z.infer<typeof budgetCategorySchema>;
export type BudgetTransactionInput = z.infer<typeof budgetTransactionSchema>;
