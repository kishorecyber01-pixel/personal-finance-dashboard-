import {
  useEffect,
  useState,
} from "react";

import { useProfile } from "../../context/ProfileContext";

export default function ProfileSettings() {
  const {
    profile,
    profileLoading,
    profileSaving,
    profileError,
    updateProfile,
  } = useProfile();

  const [fullName, setFullName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [salary, setSalary] =
    useState(0);

  const [salaryDay, setSalaryDay] =
    useState(1);

  const [currency, setCurrency] =
    useState("INR");

  const [timezone, setTimezone] =
    useState("Asia/Kolkata");

  const [saveMessage, setSaveMessage] =
    useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setFullName(profile.full_name);
    setPhone(profile.phone ?? "");
    setSalary(profile.monthly_salary);
    setSalaryDay(profile.salary_day);
    setCurrency(profile.preferred_currency);
    setTimezone(profile.timezone);
  }, [profile]);

  async function handleSave() {
    if (!profile) {
      return;
    }

    if (!fullName.trim()) {
      window.alert(
        "Please enter your full name."
      );
      return;
    }

    if (
      !Number.isFinite(salary) ||
      salary < 0
    ) {
      window.alert(
        "Monthly salary must be zero or greater."
      );
      return;
    }

    if (
      !Number.isInteger(salaryDay) ||
      salaryDay < 1 ||
      salaryDay > 31
    ) {
      window.alert(
        "Salary day must be between 1 and 31."
      );
      return;
    }

    try {
      setSaveMessage(null);

      await updateProfile({
        ...profile,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        monthly_salary: salary,
        salary_day: salaryDay,
        preferred_currency: currency,
        timezone: timezone.trim(),
      });

      setSaveMessage(
        "Profile updated successfully."
      );
    } catch (error) {
      console.error(
        "Failed to save profile settings:",
        error
      );
    }
  }

  if (profileLoading) {
    return (
      <section className="dashboard-section">
        <div className="loading-card">
          Loading profile...
        </div>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="dashboard-section">
        <div
          className="loading-card"
          role="alert"
        >
          Unable to find your profile.
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">
            Account
          </p>

          <h2>Profile Settings</h2>

          <p>
            Manage your personal and financial
            preferences.
          </p>
        </div>
      </div>

      {profileError && (
        <div
          className="loading-card"
          role="alert"
        >
          {profileError}
        </div>
      )}

      {saveMessage && (
        <div
          className="loading-card"
          role="status"
        >
          {saveMessage}
        </div>
      )}

      <div className="form-grid">
        <label>
          Full Name

          <input
            type="text"
            value={fullName}
            onChange={(event) => {
              setFullName(
                event.target.value
              );
              setSaveMessage(null);
            }}
            placeholder="Enter your full name"
          />
        </label>

        <label>
          Phone Number

          <input
            type="tel"
            value={phone}
            onChange={(event) => {
              setPhone(
                event.target.value
              );
              setSaveMessage(null);
            }}
            placeholder="Enter your phone number"
          />
        </label>

        <label>
          Monthly Salary

          <input
            type="number"
            min="0"
            step="0.01"
            value={salary}
            onChange={(event) => {
              setSalary(
                Number(event.target.value)
              );
              setSaveMessage(null);
            }}
          />
        </label>

        <label>
          Salary Day

          <input
            type="number"
            min="1"
            max="31"
            value={salaryDay}
            onChange={(event) => {
              setSalaryDay(
                Number(event.target.value)
              );
              setSaveMessage(null);
            }}
          />
        </label>

        <label>
          Preferred Currency

          <select
            value={currency}
            onChange={(event) => {
              setCurrency(
                event.target.value
              );
              setSaveMessage(null);
            }}
          >
            <option value="INR">
              INR — Indian Rupee
            </option>

            <option value="USD">
              USD — US Dollar
            </option>

            <option value="EUR">
              EUR — Euro
            </option>

            <option value="AED">
              AED — UAE Dirham
            </option>

            <option value="GBP">
              GBP — British Pound
            </option>
          </select>
        </label>

        <label>
          Time Zone

          <input
            type="text"
            value={timezone}
            onChange={(event) => {
              setTimezone(
                event.target.value
              );
              setSaveMessage(null);
            }}
            placeholder="Asia/Kolkata"
          />
        </label>
      </div>

      <button
        className="primary-button"
        type="button"
        onClick={() => {
          void handleSave();
        }}
        disabled={profileSaving}
      >
        {profileSaving
          ? "Saving..."
          : "Save Profile"}
      </button>
    </section>
  );
}