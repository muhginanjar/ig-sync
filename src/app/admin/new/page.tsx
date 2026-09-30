import { requireAdmin } from "@/lib/auth";
import UploadForm from "@/components/admin/UploadForm";

export default async function NewPostPage() {
  await requireAdmin();
  return <UploadForm />;
}
