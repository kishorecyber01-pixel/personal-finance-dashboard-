export type NotificationType =
  | "info"
  | "warning"
  | "danger"
  | "success";

export interface FinanceNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
}