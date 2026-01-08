"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/contexts/store-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter, useSearchParams } from "next/navigation"
import { Package, CheckCircle2, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"


function ReviewForm({ productId, productName, onCancel }: { productId: string, productName: string, onCancel: () => void }) {
  const { submitReview, user } = useStore()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await submitReview(productId, rating, comment)
      alert("Review submitted successfully!")
      onCancel()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="mt-4 border-primary/20 bg-primary/5 shadow-inner">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold">Reviewing {productName}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground/80">Your Rating</label>
              <span className="text-[10px] text-muted-foreground">Account: {user?.name}</span>
            </div>
            <input
              type="number"
              min="1"
              max="5"
              className="w-20 rounded-lg border bg-background/50 backdrop-blur-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              value={rating === 0 ? "" : rating}
              onChange={(e) => setRating(Number(e.target.value))}
              placeholder="1-5"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground/80">Your Thoughts</label>
            <textarea
              className="w-full rounded-lg border bg-background/50 backdrop-blur-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/40"
              rows={3}
              placeholder="Tell us what you liked (or didn't like) about this item..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="text-xs">Cancel</Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="text-xs shadow-md">
              {isSubmitting ? "Submitting..." : "Post Review"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function OrdersPage() {
  const { user, getAllOrders, isLoading, cancelOrder, fetchOrders } = useStore()
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSuccess, setShowSuccess] = useState(false)
  const [reviewingProduct, setReviewingProduct] = useState<{ orderId: string, productId: string, productName: string } | null>(null)

  useEffect(() => {
    const successOrderId = searchParams.get("success")
    if (successOrderId) {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }, [searchParams])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?redirect=/orders")
    } else if (user) {
      fetchOrders()
    }
  }, [isLoading, user, router, fetchOrders])

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center">Loading...</div>
  }

  if (!user) {
    return null
  }

  const orders = getAllOrders()

  const handleCancelOrder = async (orderId: string) => {
    if (confirm("Are you sure you want to cancel this order?")) {
      setCancellingId(orderId)
      try {
        await cancelOrder(orderId)
      } catch (error) {
        alert("Failed to cancel order")
      } finally {
        setCancellingId(null)
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {showSuccess && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Order placed successfully!</p>
              <p className="text-sm text-green-700">You will receive a confirmation email shortly.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <h1 className="mb-2 text-3xl font-bold">My Orders</h1>
      <p className="mb-8 text-muted-foreground">Track and view your order history</p>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">No orders yet</h2>
            <p className="mb-6 text-muted-foreground">Start shopping to create your first order</p>
            <Link href="/categories">
              <Button size="lg">Browse Products</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="mb-1 flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order #{order.id}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Placed on {new Date(order.createdAt).toLocaleDateString()} at{" "}
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge
                      className={`justify-center ${order.orderStatus === "Delivered" ? "bg-green-600 hover:bg-green-700" :
                        order.orderStatus === "Cancelled" ? "bg-red-600 hover:bg-red-700" :
                          order.orderStatus === "Placed" ? "bg-blue-600 hover:bg-blue-700" :
                            "bg-yellow-600 hover:bg-yellow-700"
                        }`}
                    >
                      {order.orderStatus}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-2">
                    <h3 className="font-semibold">Items:</h3>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>
                            {item.productName} {item.selectedSize && `(${item.selectedSize})`} x {item.quantity}
                          </span>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                            {order.orderStatus === "Delivered" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => setReviewingProduct({
                                  orderId: order.id,
                                  productId: item.productId,
                                  productName: item.productName
                                })}
                              >
                                Rate & Review
                              </Button>
                            )}
                          </div>
                        </div>
                        {reviewingProduct?.orderId === order.id && reviewingProduct?.productId === item.productId && (
                          <ReviewForm
                            productId={item.productId}
                            productName={item.productName}
                            onCancel={() => setReviewingProduct(null)}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Delivery Details */}
                  <div className="rounded-lg bg-muted p-4">
                    <h3 className="mb-2 font-semibold">Delivery Details:</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Name:</span> {order.deliveryDetails.name}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Phone:</span> {order.deliveryDetails.phone}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Address:</span> {order.deliveryDetails.address}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Delivery Option:</span>{" "}
                        {order.deliveryDetails.deliveryOption === "home" ? "Home Delivery" : "Store Pickup"}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Payment Method:</span>{" "}
                        {order.deliveryDetails.paymentMethod.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {order.orderStatus !== "Delivered" && order.orderStatus !== "Cancelled" ? (
                    <div className="flex justify-end border-t pt-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingId === order.id}
                      >
                        {cancellingId === order.id ? "Cancelling..." : "Cancel Order"}
                      </Button>
                    </div>
                  ) : (
                    order.orderStatus === "Delivered" && (
                      <div className="flex flex-col items-end gap-2 border-t pt-4">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Order Delivered
                        </Badge>
                        {order.deliveredAt && (
                          <p className="text-xs text-muted-foreground">
                            Delivered on {new Date(order.deliveredAt).toLocaleDateString()} at{" "}
                            {new Date(order.deliveredAt).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    )
                  )}

                  {/* Price Breakdown */}
                  <div className="space-y-1 border-t pt-4 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal:</span>
                      <span>₹{((Number(order.total) || 0) - (Number(order.taxPrice) || 0)).toFixed(2)}</span>
                    </div>
                    {(Number(order.taxPrice) || 0) > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tax (10%):</span>
                        <span>₹{(Number(order.taxPrice) || 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 text-lg font-bold">
                      <span>Total:</span>
                      <span>₹{(Number(order.total) || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
