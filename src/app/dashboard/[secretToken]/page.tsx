import DashboardView from "@/components/DashboardView";

export default function TokenDashboardPage({
  params,
}: {
  params: { secretToken: string };
}) {
  return <DashboardView secretToken={params.secretToken} />;
}
