const FOUROVER_API_URL = process.env.FOUROVER_API_URL || "https://api.4over.com/v4"
const FOUROVER_API_KEY = process.env.FOUROVER_API_KEY

export function has4overCredentials(): boolean {
  return !!FOUROVER_API_KEY
}

interface FouroverHeaders {
  Authorization: string
  "Content-Type": string
  Accept: string
}

function getHeaders(): FouroverHeaders {
  if (!FOUROVER_API_KEY) throw new Error("FOUROVER_API_KEY is not configured")
  return {
    Authorization: `Bearer ${FOUROVER_API_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  }
}

export interface UploadFileParams {
  fileBuffer: ArrayBuffer
  filename: string
  contentType?: string
}

export interface UploadFileResult {
  file_uuid: string
  filename: string
}

export async function uploadFileTo4over(params: UploadFileParams): Promise<UploadFileResult> {
  const { fileBuffer, filename, contentType = "image/png" } = params

  const formData = new FormData()
  const blob = new Blob([fileBuffer], { type: contentType })
  formData.append("file", blob, filename)

  const res = await fetch(`${FOUROVER_API_URL}/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FOUROVER_API_KEY}`,
      Accept: "application/json",
    },
    body: formData,
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`4over file upload failed (${res.status}): ${body}`)
  }

  const data = await res.json()
  return {
    file_uuid: data.uuid || data.file_uuid || data.id,
    filename: data.filename || filename,
  }
}

export interface Submit4overOrderParams {
  product_uuid: string
  runsize_uuid: string
  turnaround_uuid: string
  colorspec_uuid: string
  file_uuid: string
  quantity: number
  shipping: {
    name: string
    address1: string
    address2?: string
    city: string
    state: string
    zip: string
    country?: string
    phone?: string
    email?: string
  }
  reference?: string
}

export interface Submit4overOrderResult {
  order_id: string
  status: string
}

export async function submit4overOrder(params: Submit4overOrderParams): Promise<Submit4overOrderResult> {
  const payload = {
    products: [
      {
        product_uuid: params.product_uuid,
        runsize_uuid: params.runsize_uuid,
        turnaround_uuid: params.turnaround_uuid,
        colorspec_uuid: params.colorspec_uuid,
        files: [{ file_uuid: params.file_uuid, side: "front" }],
        quantity: params.quantity,
      },
    ],
    shipping: {
      name: params.shipping.name,
      address1: params.shipping.address1,
      address2: params.shipping.address2 || "",
      city: params.shipping.city,
      state: params.shipping.state,
      zip: params.shipping.zip,
      country: params.shipping.country || "US",
      phone: params.shipping.phone || "",
      email: params.shipping.email || "",
    },
    reference: params.reference || "",
  }

  const res = await fetch(`${FOUROVER_API_URL}/orders`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`4over order submission failed (${res.status}): ${body}`)
  }

  const data = await res.json()
  return {
    order_id: data.order_id || data.uuid || data.id,
    status: data.status || "submitted",
  }
}

export interface FouroverProduct {
  uuid: string
  name: string
  description: string
}

export async function list4overProducts(): Promise<FouroverProduct[]> {
  const res = await fetch(`${FOUROVER_API_URL}/products`, {
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error(`Failed to fetch 4over products (${res.status})`)
  const data = await res.json()
  return data.products || data || []
}
