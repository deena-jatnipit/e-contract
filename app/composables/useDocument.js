export const useDocument = () => {
  const supabase = useSupabaseClient();

  // Utility Functions
  const generateSecureToken = (length = 32) => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";

    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      for (let i = 0; i < length; i++) {
        token += chars[array[i] % chars.length];
      }
    } else {
      for (let i = 0; i < length; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    return token;
  };

  const getCustomerDisplayNameFromProfile = (profile, customers = []) => {
    if (!profile) return "";

    let displayParts = [];

    // Add full name if available
    if (profile.full_name) {
      displayParts.push(profile.full_name);
    }

    // Add car registration number if available
    if (profile.car_registration_number) {
      displayParts.push(profile.car_registration_number);
    }

    // Add phone number if available
    if (profile.phone_number) {
      displayParts.push(profile.phone_number);
    }

    // If no parts are available, return empty string or a fallback
    return displayParts.length > 0 ? displayParts.join(" | ") : "";
  };

  // API Functions
  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("contract_templates")
        .select("*");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching templates:", error);
      return [];
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select(
          "id, contract_templates(name, file_type), customer_profile_id(customer_id, customers(display_name)), provider, token, status, document_url"
        );

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching documents:", error);
      return [];
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, display_name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching customers:", error);
      return [];
    }
  };

  const fetchCustomerProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("customer_profiles")
        .select("*");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching customer profiles:", error);
      return [];
    }
  };

  const savePhoneNumber = async (profileId, phoneNumber) => {
    try {
      const { data, error } = await supabase
        .from("customer_profiles")
        .update({
          phone_number: phoneNumber,
        })
        .eq("id", profileId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error saving phone number:", error);
      return null;
    }
  };

  const saveDocument = async (
    templateId,
    customerProfileId,
    provider,
    token
  ) => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .insert([
          {
            template_id: templateId,
            customer_profile_id: customerProfileId,
            provider: provider,
            status: "sent",
            token: token,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error saving document:", error);
      return null;
    }
  };

  const deleteDocument = async (documentId) => {
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting document:", error);
      return false;
    }
  };

  // Document Operations
  const downloadDocument = async (documentUrl) => {
    try {
      const response = await fetch(documentUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const fileName = documentUrl.split("/").pop().split("?")[0];
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error("Error downloading document:", error);
      return false;
    }
  };

  return {
    // Utility Functions
    generateSecureToken,
    getCustomerDisplayNameFromProfile,

    // API Functions
    fetchTemplates,
    fetchDocuments,
    fetchCustomers,
    fetchCustomerProfiles,
    savePhoneNumber,
    saveDocument,
    deleteDocument,

    // Document Operations
    downloadDocument,
  };
};
