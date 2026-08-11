import {
  Shipment,
  ShipmentFormData,
  ShipmentStatus,
  AdminUser,
} from "@/types/shipment";

const API_BASE_URL = "https://movemate-5973.onrender.com";

// Error types for better handling
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error | unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Helper function for API calls with better error handling
async function apiCall<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options?.headers,
    };

    // Add auth token if available
    const adminSession = localStorage.getItem("admin_session");
    if (adminSession) {
      try {
        const session = JSON.parse(adminSession);
        if (session.token) {
          headers["X-Admin-Token"] = session.token;
        }
      } catch {
        // Ignore parsing errors
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle different status codes
    if (response.status === 401) {
      // Clear admin session on unauthorized
      localStorage.removeItem("admin_session");
      return {
        success: false,
        error: "Your session has expired. Please login again.",
      };
    }

    if (response.status === 403) {
      return {
        success: false,
        error:
          "Access denied. You do not have permission to perform this action.",
      };
    }

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.error || errorMessage;
      } catch {
        // If response is not JSON, use default message
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API error:", error);

    // Check if it's a network error
    if (
      error instanceof TypeError &&
      error.message.includes("Failed to fetch")
    ) {
      return {
        success: false,
        error: `Unable to connect to the server. Please check your internet connection and try again. (${API_BASE_URL})`,
      };
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

// Track shipment
export async function trackShipment(
  trackingId: string,
): Promise<ApiResponse<Shipment>> {
  const response = await apiCall<any>(
    `/track/${encodeURIComponent(trackingId)}`,
  );

  if (response.success && response.data) {
    response.data = normalizeShipment(response.data);
  }

  return response;
}

// Create shipment
export async function createShipment(
  formData: ShipmentFormData,
): Promise<ApiResponse<Shipment>> {
  // Transform frontend format to backend format
  const backendFormat = {
    sender: {
      senderName: formData.senderName,
      senderPhone: formData.senderPhone,
      pickupLocation: formData.pickupLocation,
      pickupCity: formData.pickupCity,
      pickupCountry: formData.pickupCountry,
    },
    receiver: {
      receiverName: formData.receiverName,
      receiverPhone: formData.receiverPhone,
      deliveryLocation: formData.deliveryLocation,
      deliveryCity: formData.deliveryCity,
      deliveryCountry: formData.deliveryCountry,
    },
    package: {
      packageDescription: formData.packageDescription,
      packageWeight: formData.packageWeight,
      packageCategories: formData.packageCategory,
    },
  };

  const response = await apiCall<any>("/shipments", {
    method: "POST",
    body: JSON.stringify(backendFormat),
  });

  // Transform backend response to frontend format if needed
  if (response.success && response.data) {
    response.data = normalizeShipment(response.data);
  }

  return response;
}

function buildShipmentTimeline({
  status,
  createdAt,
  estimatedDelivery,
  deliveredAt,
  pickupCity,
  pickupCountry,
  deliveryCity,
  deliveryCountry,
  currentCity,
  currentCountry,
}: {
  status: ShipmentStatus;
  createdAt: string;
  estimatedDelivery: string;
  deliveredAt?: string;
  pickupCity: string;
  pickupCountry: string;
  deliveryCity: string;
  deliveryCountry: string;
  currentCity: string;
  currentCountry: string;
}) {
  const statuses: ShipmentStatus[] = [
    'pending',
    'processing',
    'in_transit',
    'out_for_delivery',
    'delivered',
  ];

  const currentIndex = statuses.indexOf(status);

  const titleMap: Record<ShipmentStatus, string> = {
    pending: 'Shipment Created',
    processing: 'Processing',
    in_transit: 'In Transit',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
  };

  const descriptionMap: Record<ShipmentStatus, string> = {
    pending: 'Your shipment has been created and is awaiting processing.',
    processing: 'Your shipment is being processed.',
    in_transit: `Your shipment is currently in transit through ${currentCity}, ${currentCountry}.`,
    out_for_delivery: 'Your shipment is out for delivery.',
    delivered: 'Your shipment has been delivered successfully.',
  };

  return statuses.map((itemStatus, index) => {
    const completed = index <= currentIndex;

    let location = '';

    if (itemStatus === 'pending' || itemStatus === 'processing') {
      location = `${pickupCity}, ${pickupCountry}`;
    }

    if (
      itemStatus === 'in_transit' ||
      itemStatus === 'out_for_delivery'
    ) {
      location = `${currentCity}, ${currentCountry}`;
    }

    if (itemStatus === 'delivered') {
      location = `${deliveryCity}, ${deliveryCountry}`;
    }

    let timestamp: string | undefined;

    if (itemStatus === 'pending') {
      timestamp = createdAt;
    }

    if (itemStatus === 'delivered' && deliveredAt) {
      timestamp = deliveredAt;
    }

    return {
      status: itemStatus,
      title: titleMap[itemStatus],
      description: descriptionMap[itemStatus],
      timestamp,
      location,
      completed,
    };
  });
}

// Helper function to transform backend shipment to frontend format
function normalizeShipment(backendShipment: any): Shipment {
  const status = (backendShipment.status ||
    backendShipment.Status ||
    "pending") as ShipmentStatus;

  const pickupCity = backendShipment.sender?.pickupCity?.trim() || "";

  const pickupCountry = backendShipment.sender?.pickupCountry?.trim() || "";

  const deliveryCity = backendShipment.receiver?.deliveryCity?.trim() || "";

  const deliveryCountry =
    backendShipment.receiver?.deliveryCountry?.trim() || "";

  // Backend currently stores the current location inside the timeline string.
  // Example: "in_transit - Chicago, United States"
  let currentCity = pickupCity;
  let currentCountry = pickupCountry;

  const timelineText =
    typeof backendShipment.timeline === "string"
      ? backendShipment.timeline
      : "";

  if (timelineText.includes(" - ")) {
    const [, location] = timelineText.split(" - ");

    if (location) {
      const parts = location.split(",").map((part: string) => part.trim());

      if (parts.length >= 2) {
        currentCity = parts[0];
        currentCountry = parts.slice(1).join(", ");
      }
    }
  }

  // If backend eventually provides currentLocation directly,
  // prefer that over the timeline string.
  if (backendShipment.currentLocation) {
    currentCity = backendShipment.currentLocation.city?.trim() || currentCity;

    currentCountry =
      backendShipment.currentLocation.country?.trim() || currentCountry;
  }

  const timeline = buildShipmentTimeline({
    status,
    createdAt:
      backendShipment.createdAt ||
      backendShipment.CreatedAt ||
      new Date().toISOString(),
    estimatedDelivery:
      backendShipment.estimatedDelivery ||
      backendShipment.EstimatedDelivery ||
      new Date().toISOString(),
    deliveredAt: backendShipment.deliveryAt || backendShipment.DeliveryAt,
    pickupCity,
    pickupCountry,
    deliveryCity,
    deliveryCountry,
    currentCity,
    currentCountry,
  });

  return {
    id: backendShipment.id || backendShipment.Id,
    trackingId: backendShipment.trackingId || backendShipment.TrackingId,

    status,

    senderName: backendShipment.sender?.senderName || "",
    senderPhone: backendShipment.sender?.senderPhone || "",
    pickupLocation: backendShipment.sender?.pickupLocation || "",
    pickupCity,
    pickupCountry,

    receiverName: backendShipment.receiver?.receiverName || "",
    receiverPhone: backendShipment.receiver?.receiverPhone || "",
    deliveryLocation: backendShipment.receiver?.deliveryLocation || "",
    deliveryCity,
    deliveryCountry,

    packageDescription: backendShipment.package?.packageDescription || "",
    packageWeight: backendShipment.package?.packageWeight || 0,
    packageCategory: (backendShipment.package?.packageCategories ||
      "other") as any,

    createdAt:
      backendShipment.createdAt ||
      backendShipment.CreatedAt ||
      new Date().toISOString(),

    estimatedDelivery:
      backendShipment.estimatedDelivery ||
      backendShipment.EstimatedDelivery ||
      new Date().toISOString(),

    deliveredAt: backendShipment.deliveryAt || backendShipment.DeliveryAt,

    currentLocation: {
      city: currentCity,
      country: currentCountry,
      coordinates: {
        lat: 0,
        lng: 0,
      },
    },

    timeline,
  };
}

// Update shipment status (admin)
export async function updateShipmentStatus(
  trackingId: string,
  status: ShipmentStatus,
  location?: string,
): Promise<ApiResponse<Shipment>> {
  const body: any = { status };
  if (location) {
    body.location = location;
  }

  const response = await apiCall<any>(
    `/shipment/status/${encodeURIComponent(trackingId)}`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    },
  );

  if (response.success && response.data) {
    response.data = normalizeShipment(response.data);
  }

  return response;
}

// Update shipment ETA (admin)
export async function updateShipmentEta(
  trackingId: string,
  newEta: string,
): Promise<ApiResponse<Shipment>> {
  const response = await apiCall<any>(
    `/shipment/eta/${encodeURIComponent(trackingId)}`,
    {
      method: "PUT",
      body: JSON.stringify({ newEta }),
    },
  );

  if (response.success && response.data) {
    response.data = normalizeShipment(response.data);
  }

  return response;
}

// Update shipment location (admin)
export async function updateShipmentLocation(
  trackingId: string,
  city: string,
  country: string,
  note?: string,
): Promise<ApiResponse<Shipment>> {
  const response = await apiCall<any>(
    `/shipment/location/${encodeURIComponent(trackingId)}`,
    {
      method: "PUT",
      body: JSON.stringify({ city, country, note }),
    },
  );

  if (response.success && response.data) {
    response.data = normalizeShipment(response.data);
  }

  return response;
}

// Admin login
export async function adminLogin(
  username: string,
  password: string,
): Promise<ApiResponse<AdminUser>> {
  const response = await apiCall<AdminUser>("/admin/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  if (response.success && response.data) {
    // Store admin session with a dummy token
    localStorage.setItem(
      "admin_session",
      JSON.stringify({
        ...response.data,
        token: "admin-secret",
        loginTime: new Date().toISOString(),
      }),
    );
  }

  return response;
}

// Admin logout
export async function adminLogout(): Promise<ApiResponse<null>> {
  const response = await apiCall<null>("/admin/logout", {
    method: "POST",
  });

  localStorage.removeItem("admin_session");
  return response;
}

// Get all shipments (admin)
export async function getAllShipments(): Promise<ApiResponse<Shipment[]>> {
  const response = await apiCall<any[]>("/admin/shipments");

  if (response.success && response.data) {
    response.data = response.data.map(normalizeShipment);
  }

  return response;
}

// Get shipment analytics
export async function getAnalytics(): Promise<
  ApiResponse<{
    total: number;
    delivered: number;
    inTransit: number;
    pending: number;
    statusDistribution: { status: string; count: number }[];
  }>
> {
  return apiCall("/admin/analytics");
}

// Batch update shipment status
export async function batchUpdateStatus(
  updates: Array<{ trackingId: string; status: ShipmentStatus }>,
): Promise<ApiResponse<Shipment[]>> {
  const results: Shipment[] = [];
  const errors: string[] = [];

  for (const update of updates) {
    try {
      const response = await updateShipmentStatus(
        update.trackingId,
        update.status,
      );
      if (response.success && response.data) {
        results.push(response.data);
      } else {
        errors.push(`Failed to update ${update.trackingId}: ${response.error}`);
      }
    } catch (error) {
      errors.push(`Error updating ${update.trackingId}: ${error}`);
    }
  }

  return {
    success: errors.length === 0,
    data: results,
    error: errors.length > 0 ? errors.join("; ") : undefined,
  };
}
