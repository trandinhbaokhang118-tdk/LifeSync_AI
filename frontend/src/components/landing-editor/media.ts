import { API_URL } from "../../lib/api-config";
export function landingImageUrl(value: string) {
  return value.startsWith("/content/assets/") ? `${API_URL}${value}` : value;
}
