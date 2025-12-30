"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useStore, type Address } from "@/contexts/store-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useRouter } from "next/navigation"
import { ShoppingBag, Package, CreditCard, Banknote, CheckCircle2, Plus, MapPin } from "lucide-react"

export default function CheckoutPage() {
  const { cart, createOrder, user, getCartTotal, isLoading } = useStore()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    deliveryOption: "home" as "home" | "pickup",
    paymentMethod: "credit" as "credit" | "debit" | "cod",
  })

  const [selectedAddressMode, setSelectedAddressMode] = useState<string>("new")
  const [isProcessing, setIsProcessing] = useState(false)

  const total = getCartTotal()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login?redirect=/checkout")
      } else if (cart.length === 0) {
        router.push("/cart")
      } else if (user?.addresses && user.addresses.length > 0) {
        // Pre-select the default address or the first one
        const defaultIndex = user.addresses.findIndex(a => a.isDefault)
        const indexToUse = defaultIndex >= 0 ? defaultIndex : 0
        setSelectedAddressMode(indexToUse.toString())
        selectAddress(user.addresses[indexToUse])
      }
    }
  }, [isLoading, user, cart, router])

  const selectAddress = (address: Address) => {
    setFormData(prev => ({
      ...prev,
      name: address.name,
      phone: address.phone,
      address: address.address,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country
    }))
    // Generate a unique ID for selection state if needed, or just use index/some other way
    // For now we rely on content matching or just 'existing' mode visual
    // Actually we need to track which radio button is active
    // We can use a composite key or index
  }

  const handleAddressSelection = (value: string) => {
    setSelectedAddressMode(value)
    if (value === "new") {
      setFormData(prev => ({
        ...prev,
        name: "",
        phone: "",
        address: "",
        city: "",
        postalCode: "",
        country: ""
      }))
    } else {
      const index = parseInt(value)
      if (user?.addresses && user.addresses[index]) {
        selectAddress(user.addresses[index])
      }
    }
  }

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center">Loading...</div>
  }

  if (!user || cart.length === 0) {
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      const order = await createOrder({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country,
        deliveryOption: formData.deliveryOption,
        paymentMethod: formData.paymentMethod,
      })

      // Simulate processing delay
      setTimeout(() => {
        setIsProcessing(false)
        router.push(`/orders?success=${order.id}`)
      }, 1500)
    } catch (error) {
      console.error("Checkout error:", error)
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Checkout</h1>
      <p className="mb-8 text-muted-foreground">Complete your order details</p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form onSubmit={handleCheckout} className="space-y-6">

            {/* Address Selection */}
            {user.addresses && user.addresses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Select Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedAddressMode} onValueChange={handleAddressSelection} className="grid gap-4 sm:grid-cols-2">
                    {user.addresses.map((addr, index) => (
                      <div key={index}>
                        <RadioGroupItem value={index.toString()} id={`addr-${index}`} className="peer sr-only" />
                        <Label
                          htmlFor={`addr-${index}`}
                          className="flex flex-col gap-1 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <span className="font-semibold">{addr.name}</span>
                          <span className="text-sm text-muted-foreground">{addr.address}</span>
                          <span className="text-sm text-muted-foreground">{addr.city}, {addr.postalCode}</span>
                          <span className="text-sm text-muted-foreground">{addr.phone}</span>
                        </Label>
                      </div>
                    ))}
                    <div>
                      <RadioGroupItem value="new" id="addr-new" className="peer sr-only" />
                      <Label
                        htmlFor="addr-new"
                        className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary cursor-pointer border-dashed"
                      >
                        <Plus className="h-6 w-6 text-muted-foreground" />
                        <span className="font-semibold text-muted-foreground">Add New Address</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            )}

            {/* Delivery Details Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Delivery Information
                </CardTitle>
                {selectedAddressMode !== "new" && (
                  <CardDescription>Review the selected address details below.</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Delivery Address *</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="123 Main St, Apt 4B"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="New York"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      placeholder="10001"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    name="country"
                    placeholder="United States"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Delivery Option */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Option</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={formData.deliveryOption}
                  onValueChange={(value) => setFormData({ ...formData, deliveryOption: value as "home" | "pickup" })}
                >
                  <div className="flex items-center space-x-3 rounded-lg border p-4">
                    <RadioGroupItem value="home" id="home" />
                    <Label htmlFor="home" className="flex flex-1 cursor-pointer items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">Home Delivery</p>
                        <p className="text-sm text-muted-foreground">Delivered to your doorstep</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 rounded-lg border p-4">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex flex-1 cursor-pointer items-center gap-2">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">Store Pickup</p>
                        <p className="text-sm text-muted-foreground">Collect from nearest store</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={formData.paymentMethod}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paymentMethod: value as "credit" | "debit" | "cod" })
                  }
                >
                  <div className="flex items-center space-x-3 rounded-lg border p-4">
                    <RadioGroupItem value="credit" id="credit" />
                    <Label htmlFor="credit" className="flex flex-1 cursor-pointer items-center gap-2">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold">Stripe</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 rounded-lg border p-4">
                    <RadioGroupItem value="debit" id="debit" />
                    <Label htmlFor="debit" className="flex flex-1 cursor-pointer items-center gap-2">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold">Razorpay</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 rounded-lg border p-4">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex flex-1 cursor-pointer items-center gap-2">
                      <Banknote className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold">Cash on Delivery</span>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Button type="submit" size="lg" className="w-full" disabled={isProcessing}>
              {isProcessing ? (
                <>Processing...</>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Place Order
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {cart.map((item) => {
                  const itemKey = item.selectedSize ? `${item.id}-${item.selectedSize}` : item.id
                  return (
                    <div key={itemKey} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium line-clamp-1">{item.name}</p>
                        <p className="text-muted-foreground">
                          Qty: {item.quantity}
                          {item.selectedSize && ` • Size: ${item.selectedSize}`}
                        </p>
                      </div>
                      <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  )
                })}
              </div>
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-foreground">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping:</span>
                  <span className="font-semibold text-green-600">Free</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (10%):</span>
                  <span className="font-semibold text-foreground">₹{(total * 0.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-3 text-xl font-bold">
                  <span>Total:</span>
                  <span>₹{(total * 1.1).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
