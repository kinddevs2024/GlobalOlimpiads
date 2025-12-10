import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/api";
import { USER_ROLES } from "../../utils/constants";
import NotificationToast from "../../components/NotificationToast";
import "./CompleteProfile.css";

const CompleteProfile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    tel: "",
    address: "",
    schoolName: "",
    schoolId: "",
    dateBorn: "",
    gender: "",
    userLogo: null,
  });

  useEffect(() => {
    // If user already has complete profile, redirect to dashboard
    if (user) {
      const hasCompleteInfo =
        user.name &&
        user.tel &&
        user.address &&
        user.dateBorn &&
        user.gender &&
        (user.role !== USER_ROLES.STUDENT ||
          (user.schoolName && user.schoolId));

      if (hasCompleteInfo) {
        navigate("/dashboard");
        return;
      }

      // Pre-fill with existing data if available
      const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      setFormData({
        name:
          user.name ||
          `${user.firstName || ""} ${user.secondName || ""}`.trim() ||
          "",
        tel: user.tel || "",
        address: user.address || "",
        schoolName: user.schoolName || "",
        schoolId: user.schoolId || "",
        dateBorn: user.dateBorn ? formatDateForInput(user.dateBorn) : "",
        gender: user.gender || "",
        userLogo: null,
      });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    if (e.target.type === "file") {
      setFormData({
        ...formData,
        [e.target.name]: e.target.files[0] || null,
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    try {
      let logoUrl = user.userLogo || null;

      // First, upload logo if a new one is selected
      if (formData.userLogo) {
        try {
          const logoResponse = await authAPI.uploadLogo(formData.userLogo);
          logoUrl =
            logoResponse.data.logoUrl ||
            logoResponse.data.url ||
            logoResponse.data.userLogo;
        } catch (logoError) {
          setNotification({
            message:
              logoError.response?.data?.message ||
              "Failed to upload logo. Please try again.",
            type: "error",
          });
          setLoading(false);
          return;
        }
      }

      // Then update profile with all information
      // Parse name into firstName and secondName if needed
      const nameParts = formData.name.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const secondName = nameParts.slice(1).join(" ") || "";

      const updateData = new FormData();
      updateData.append("name", formData.name);
      updateData.append("firstName", firstName);
      updateData.append("secondName", secondName);
      updateData.append("email", user.email || ""); // Include email
      updateData.append("tel", formData.tel || "");
      updateData.append("address", formData.address || "");

      // Date of birth - convert to ISO string if present
      if (formData.dateBorn) {
        // Ensure date is in correct format
        const dateValue = formData.dateBorn.includes("T")
          ? formData.dateBorn
          : `${formData.dateBorn}T00:00:00`;
        updateData.append("dateBorn", new Date(dateValue).toISOString());
      } else {
        updateData.append("dateBorn", "");
      }

      // Gender
      updateData.append("gender", formData.gender || "");

      // Only append school fields if user is a student
      if (user.role === USER_ROLES.STUDENT) {
        updateData.append("schoolName", formData.schoolName || "");
        updateData.append("schoolId", formData.schoolId || "");
      }

      // Append logo URL if we have one
      if (logoUrl) {
        updateData.append("userLogo", logoUrl);
      }

      // Debug: Log FormData contents
      console.log("=== Complete Profile Form Data Being Sent ===");
      console.log("name:", formData.name);
      console.log("firstName:", firstName);
      console.log("secondName:", secondName);
      console.log("email:", user.email);
      console.log("tel:", formData.tel);
      console.log("address:", formData.address);
      console.log("dateBorn:", formData.dateBorn);
      console.log("gender:", formData.gender);
      console.log("schoolName:", formData.schoolName);
      console.log("schoolId:", formData.schoolId);
      console.log("logoUrl:", logoUrl);

      // Validate required fields before sending
      if (!formData.name || !formData.name.trim()) {
        setNotification({
          message: "Name is required",
          type: "error",
        });
        setLoading(false);
        return;
      }

      if (!formData.tel || !formData.tel.trim()) {
        setNotification({
          message: "Phone number is required",
          type: "error",
        });
        setLoading(false);
        return;
      }

      if (!formData.address || !formData.address.trim()) {
        setNotification({
          message: "Address is required",
          type: "error",
        });
        setLoading(false);
        return;
      }

      if (!formData.dateBorn) {
        setNotification({
          message: "Date of birth is required",
          type: "error",
        });
        setLoading(false);
        return;
      }

      if (!formData.gender) {
        setNotification({
          message: "Gender is required",
          type: "error",
        });
        setLoading(false);
        return;
      }

      if (user.role === USER_ROLES.STUDENT) {
        if (!formData.schoolName || !formData.schoolName.trim()) {
          setNotification({
            message: "School name is required",
            type: "error",
          });
          setLoading(false);
          return;
        }
        if (!formData.schoolId || !formData.schoolId.trim()) {
          setNotification({
            message: "School ID is required",
            type: "error",
          });
          setLoading(false);
          return;
        }
      }

      // If no new logo is being uploaded, try sending as JSON instead
      // This might work better if backend has issues parsing FormData
      let response;
      if (!formData.userLogo) {
        // No file upload, send as JSON
        const jsonData = {
          name: formData.name.trim(),
          email: user.email || "",
          firstName: firstName,
          secondName: secondName,
          tel: formData.tel.trim(),
          address: formData.address.trim(),
          gender: formData.gender,
          dateBorn: formData.dateBorn
            ? new Date(formData.dateBorn + "T00:00:00").toISOString()
            : null,
        };

        if (user.role === USER_ROLES.STUDENT) {
          jsonData.schoolName = formData.schoolName.trim();
          jsonData.schoolId = formData.schoolId.trim();
        }

        if (logoUrl) {
          jsonData.userLogo = logoUrl;
        }

        console.log("Sending as JSON (no file upload):", jsonData);
        response = await authAPI.updateProfile(jsonData);
      } else {
        // Has file upload, use FormData
        console.log("Calling updateProfile API with FormData...");
        response = await authAPI.updateProfile(updateData);
      }

      console.log("Profile update response:", response);
      console.log("Response status:", response?.status);
      console.log("Response data:", response?.data);

      // Handle different response formats
      let updatedUser = null;
      if (response?.data) {
        if (response.data.user) {
          updatedUser = response.data.user;
        } else if (response.data._id) {
          // Response is the user object directly
          updatedUser = response.data;
        } else if (typeof response.data === 'object') {
          updatedUser = response.data;
        }
      }

      if (!updatedUser) {
        throw new Error("Invalid response format from server");
      }

      console.log("Updated user object:", updatedUser);

      // Update user in context (this also saves to localStorage)
      setUser(updatedUser);

      // Refresh user data from server to ensure we have the latest complete data
      try {
        const meResponse = await authAPI.getMe();
        const freshUser = meResponse.data;
        console.log("Fresh user data from server:", freshUser);
        // Update with fresh data (this saves to localStorage)
        if (freshUser) {
          setUser(freshUser);
        }
      } catch (meError) {
        console.warn("Failed to refresh user data, using response data:", meError);
        // Even if refresh fails, we still have the updated user from the response
      }

      setNotification({
        message: "Profile completed successfully!",
        type: "success",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Profile completion error:", error);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);
      console.error("Error message:", error.message);
      
      let errorMessage = "Failed to complete profile. Please check all required fields.";
      
      if (error.response?.data) {
        // Try to extract error message from response
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.errors) {
          // Handle validation errors
          const errors = error.response.data.errors;
          if (Array.isArray(errors)) {
            errorMessage = errors.map(e => e.message || e).join(', ');
          } else if (typeof errors === 'object') {
            errorMessage = Object.values(errors).flat().join(', ');
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Check for network errors
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        errorMessage = "Network error. Please check your connection and try again.";
      }

      setNotification({
        message: errorMessage,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="complete-profile-page">
        <div className="container">
          <div className="profile-loading">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="complete-profile-page">
      <div className="container">
        <div className="complete-profile-header">
          <h1 className="complete-profile-title text-glow">
            Complete Your Profile
          </h1>
          <p className="complete-profile-subtitle">
            Please provide the following information to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="complete-profile-form card">
          <div className="form-section">
            <h3 className="section-title">Profile Picture</h3>
            <div className="form-group">
              <label htmlFor="userLogo">Upload Profile Picture</label>
              <input
                type="file"
                id="userLogo"
                name="userLogo"
                accept="image/*"
                onChange={handleChange}
                className="file-input"
              />
              {formData.userLogo && (
                <div className="file-preview">
                  <img
                    src={URL.createObjectURL(formData.userLogo)}
                    alt="Preview"
                    className="preview-image"
                  />
                </div>
              )}
              {!formData.userLogo && user.userLogo && (
                <div className="file-preview">
                  <img
                    src={user.userLogo}
                    alt="Current"
                    className="preview-image"
                  />
                  <p className="preview-note">Current profile picture</p>
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Personal Information</h3>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dateBorn">Date of Birth</label>
                <input
                  type="date"
                  id="dateBorn"
                  name="dateBorn"
                  value={formData.dateBorn}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="tel">Phone Number</label>
              <input
                type="tel"
                id="tel"
                name="tel"
                value={formData.tel}
                onChange={handleChange}
                required
                placeholder="Enter your phone number"
              />
            </div>
            <div className="form-group">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="Enter your address"
                rows="3"
              />
            </div>
          </div>

          {user.role === USER_ROLES.STUDENT && (
            <div className="form-section">
              <h3 className="section-title">School Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="schoolName">School Name</label>
                  <input
                    type="text"
                    id="schoolName"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleChange}
                    required
                    placeholder="Enter your school name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="schoolId">School ID</label>
                  <input
                    type="text"
                    id="schoolId"
                    name="schoolId"
                    value={formData.schoolId}
                    onChange={handleChange}
                    required
                    placeholder="Enter your school ID"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="button-primary" disabled={loading}>
              {loading ? "Saving..." : "Complete Profile"}
            </button>
          </div>
        </form>

        {notification && (
          <NotificationToast
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </div>
  );
};

export default CompleteProfile;
