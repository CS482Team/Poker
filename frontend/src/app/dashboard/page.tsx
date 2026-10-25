import TableList from "@/component/TableList";

/* The lobby. It lives here because the sign-in page took "/" and sends people to /dashboard after login. */
export default function Dashboard() {
  return <TableList />;
}
