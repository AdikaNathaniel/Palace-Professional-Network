import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { fetchOptions, submitBiodata, ApiError } from '../api/apiService';
import type { BiodataFormValues, BiodataOptions } from '../types/biodata';
import IpcLogo from './IpcLogo';

const EMPTY_VALUES: BiodataFormValues = {
  fullName: '',
  ageRange: '',
  gender: '',
  maritalStatus: '',
  email: '',
  phoneNumber: '',
  professionCategory: '',
  professionSubCategory: '',
  placeOfWork: '',
};

const BUSINESS_CATEGORY_KEY = 'Businessmen and Women';
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Props = {
  onSubmitted: () => void;
};

export default function BiodataForm({ onSubmitted }: Props) {
  const [options, setOptions] = useState<BiodataOptions | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [values, setValues] = useState<BiodataFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadOptions = () => {
    setLoadingOptions(true);
    setOptionsError(null);
    fetchOptions()
      .then(setOptions)
      .catch((e) => setOptionsError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoadingOptions(false));
  };

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const needsSubCategory = values.professionCategory.includes(BUSINESS_CATEGORY_KEY);

  const setField = <K extends keyof BiodataFormValues>(key: K, value: BiodataFormValues[K]) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'professionCategory' ? { professionSubCategory: '' } : {}),
    }));
  };

  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!values.fullName.trim()) next.fullName = 'Full name is required';
    if (!values.ageRange) next.ageRange = 'Required';
    if (!values.gender) next.gender = 'Required';
    if (!values.maritalStatus) next.maritalStatus = 'Required';
    if (values.email.trim() && !EMAIL_RE.test(values.email.trim())) {
      next.email = 'Enter a valid email address';
    }
    if (!values.phoneNumber.trim()) next.phoneNumber = 'Phone number is required';
    if (!values.professionCategory) next.professionCategory = 'Required';
    if (needsSubCategory && !values.professionSubCategory) {
      next.professionSubCategory = 'Please select a specific trade/business type';
    }
    if (!values.placeOfWork.trim()) next.placeOfWork = 'Place of work is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const resetForm = () => {
    setValues(EMPTY_VALUES);
    setErrors({});
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await submitBiodata(values, imageFile);
      setSubmitSuccess(true);
      resetForm();
      onSubmitted();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const subCategoryGroups = useMemo(
    () => (options ? Object.entries(options.professionSubCategories) : []),
    [options],
  );

  if (loadingOptions) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        Loading form…
      </div>
    );
  }

  if (optionsError || !options) {
    return (
      <div className="error-state">
        Could not reach the server.
        <br />
        {optionsError}
        <br />
        <button onClick={loadOptions}>Retry</button>
      </div>
    );
  }

  return (
    <>
      <IpcLogo />
      <div className="intro-card">
        <div className="intro-card-inner">
          <p className="intro-lead">
            Welcome to the International Palace Church (The Palace), Palace Professional Network
            Biodata Form.
          </p>
          <p>
            This form serves as a secure database for Christian professionals in IPC. The
            information collected helps us to build a credible directory of professionals, to
            facilitate <strong>professional networking and mentorship.</strong>
          </p>
          <p>
            Your information will not be shared with third parties or used for any purpose outside
            the church&rsquo;s professional fellowship activities.
          </p>
          <p className="intro-thanks">Thank you for the willingness to be part of this vision.</p>
        </div>
      </div>

      {submitSuccess && (
        <div className="banner success">Biodata submitted successfully. Thank you!</div>
      )}
      {submitError && <div className="banner error">{submitError}</div>}

      <form className="biodata-form" onSubmit={handleSubmit} noValidate>
        <div className="image-picker">
          <div className="image-picker-circle" onClick={handleImageClick} role="button" tabIndex={0}>
            {imagePreview ? (
              <img src={imagePreview} alt="Selected profile" />
            ) : (
              <span aria-hidden>👤</span>
            )}
            <span className="image-picker-badge" aria-hidden>
              📷
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            hidden
            onChange={handleImageChange}
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="fullName">
            Full name<span className="required">*</span>
          </label>
          <input
            id="fullName"
            className="text-input"
            placeholder="e.g. Mr. Vincent Kumah"
            value={values.fullName}
            onChange={(e) => setField('fullName', e.target.value)}
          />
          {errors.fullName && <div className="field-error">{errors.fullName}</div>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="ageRange">
            Age<span className="required">*</span>
          </label>
          <select
            id="ageRange"
            className="select-input"
            value={values.ageRange}
            onChange={(e) => setField('ageRange', e.target.value)}
          >
            <option value="" disabled>
              Select an age range
            </option>
            {options.ageRanges.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          {errors.ageRange && <div className="field-error">{errors.ageRange}</div>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="gender">
            Gender<span className="required">*</span>
          </label>
          <select
            id="gender"
            className="select-input"
            value={values.gender}
            onChange={(e) => setField('gender', e.target.value)}
          >
            <option value="" disabled>
              Select gender
            </option>
            {options.genders.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          {errors.gender && <div className="field-error">{errors.gender}</div>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="maritalStatus">
            Marital Status<span className="required">*</span>
          </label>
          <select
            id="maritalStatus"
            className="select-input"
            value={values.maritalStatus}
            onChange={(e) => setField('maritalStatus', e.target.value)}
          >
            <option value="" disabled>
              Select marital status
            </option>
            {options.maritalStatuses.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {errors.maritalStatus && <div className="field-error">{errors.maritalStatus}</div>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            className="text-input"
            type="email"
            placeholder="Your answer"
            value={values.email}
            onChange={(e) => setField('email', e.target.value)}
          />
          {errors.email && <div className="field-error">{errors.email}</div>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="phoneNumber">
            Phone number<span className="required">*</span>
          </label>
          <input
            id="phoneNumber"
            className="text-input"
            type="tel"
            placeholder="Your answer"
            value={values.phoneNumber}
            onChange={(e) => setField('phoneNumber', e.target.value)}
          />
          {errors.phoneNumber && <div className="field-error">{errors.phoneNumber}</div>}
        </div>

        <div className="field field-full">
          <label className="field-label" htmlFor="professionCategory">
            Profession / Occupation<span className="required">*</span>
          </label>
          <select
            id="professionCategory"
            className="select-input"
            value={values.professionCategory}
            onChange={(e) => setField('professionCategory', e.target.value)}
          >
            <option value="" disabled>
              Select a profession category
            </option>
            {options.professionCategories.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {errors.professionCategory && (
            <div className="field-error">{errors.professionCategory}</div>
          )}
        </div>

        {needsSubCategory && (
          <div className="field field-full">
            <label className="field-label" htmlFor="professionSubCategory">
              Specific trade / business type<span className="required">*</span>
            </label>
            <select
              id="professionSubCategory"
              className="select-input"
              value={values.professionSubCategory}
              onChange={(e) => setField('professionSubCategory', e.target.value)}
            >
              <option value="" disabled>
                Select a trade / business type
              </option>
              {subCategoryGroups.map(([group, items]) => (
                <optgroup key={group} label={group}>
                  {items.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {errors.professionSubCategory && (
              <div className="field-error">{errors.professionSubCategory}</div>
            )}
          </div>
        )}

        <div className="field field-full">
          <label className="field-label" htmlFor="placeOfWork">
            Place of Work<span className="required">*</span>
          </label>
          <input
            id="placeOfWork"
            className="text-input"
            placeholder="Your answer"
            value={values.placeOfWork}
            onChange={(e) => setField('placeOfWork', e.target.value)}
          />
          {errors.placeOfWork && <div className="field-error">{errors.placeOfWork}</div>}
        </div>

        <button className="submit-btn" type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </>
  );
}
