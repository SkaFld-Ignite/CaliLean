import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ClockSolid } from "@medusajs/icons"
import { Container, Heading, Badge, createDataTableColumnHelper, useDataTable, DataTablePaginationState, DataTable } from "@medusajs/ui"
import { useCallback, useEffect, useMemo, useState } from "react"
import { SubscriptionData, SubscriptionStatus } from "../../types"
import { sdk } from "../../lib/sdk"
import { useNavigate } from "react-router-dom"

const getBadgeColor = (status: SubscriptionStatus) => {
  switch(status) {
    case SubscriptionStatus.CANCELED:
      return "orange"
    case SubscriptionStatus.FAILED:
      return "red"
    case SubscriptionStatus.EXPIRED:
      return "grey"
    default:
      return "green"
  }
}

const getStatusTitle = (status: SubscriptionStatus) => {
  return status.charAt(0).toUpperCase() + status.substring(1)
}

const columnHelper = createDataTableColumnHelper<SubscriptionData>()

const columns = [
  columnHelper.accessor("id", {
    header: "#",
  }),
  columnHelper.accessor("metadata.main_order_id", {
    header: "Main Order",
  }),
  columnHelper.accessor("customer.email", {
    header: "Customer",
  }),
  columnHelper.accessor("interval", {
    header: "Plan",
    cell: ({ getValue }) => {
      const interval = getValue()
      return (
        <span className="flex items-center gap-x-2">
          {interval === "monthly" ? "Monthly" : "Yearly"}
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-800 border border-green-200">
            11.5% off
          </span>
        </span>
      )
    },
  }),
  columnHelper.accessor("subscription_date", {
    header: "Started",
    cell: ({ getValue }) => new Date(getValue()).toLocaleDateString(),
  }),
  columnHelper.accessor("next_order_date", {
    header: "Next Order",
    cell: ({ getValue }) => {
      const v = getValue()
      return v ? new Date(v).toLocaleDateString() : "—"
    },
  }),
  columnHelper.accessor("expiration_date", {
    header: "Expires",
    cell: ({ getValue }) => new Date(getValue()).toLocaleDateString(),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => (
      <Badge color={getBadgeColor(getValue())}>
        {getStatusTitle(getValue())}
      </Badge>
    ),
  }),
]

const SubscriptionsPage = () => {
  const navigate = useNavigate()
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: 20,
    pageIndex: 0,
  })
  const [data, setData] = useState<{
    subscriptions: SubscriptionData[]
    count: number
  } | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  const query = useMemo(() => {
    return new URLSearchParams({
      limit: `${pagination.pageSize}`,
      offset: `${pagination.pageIndex * pagination.pageSize}`,
    })
  }, [pagination])

  const fetchSubscriptions = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await sdk.client.fetch(`/admin/subscriptions?${query.toString()}`)
      setData(result as { subscriptions: SubscriptionData[]; count: number })
    } finally {
      setIsLoading(false)
    }
  }, [query])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  const table = useDataTable({
    columns,
    data: data?.subscriptions || [],
    getRowId: (subscription) => subscription.id,
    rowCount: data?.count || 0,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    onRowClick(event, row) {
      navigate(`/subscriptions/${row.id}`)
    },
  })

  return (
    <Container>
      <DataTable instance={table}>
        <DataTable.Toolbar>
          <Heading level="h1">Subscriptions</Heading>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Subscriptions",
  icon: ClockSolid,
})

export default SubscriptionsPage
