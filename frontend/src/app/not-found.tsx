import ErrorState from "@/component/common/ErrorState";

export const metadata = { title: "Page Not Found" };

export default function NotFound() {
  return <ErrorState title="404" message="This page doesn't exist." />;
}
