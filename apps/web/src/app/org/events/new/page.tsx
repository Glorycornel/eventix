'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { API_BASE } from '../../../../lib/api';
import { BannerUploadField } from '../../../../components/BannerUploadField';
import { DateTimePicker } from '../../../../components/DateTimePicker';
import { AuthPrompt } from '../../../../components/AuthPrompt';
import { useAuth } from '../../../../components/AuthProvider';
import { StyledDropdown } from '../../../../components/StyledDropdown';
import { EVENT_CATEGORY_GROUPS } from '../../../../lib/categories';

export default function NewEventPage() {
  const { token } = useAuth();
  const [status, setStatus] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [formKey, setFormKey] = useState(0);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');

  const selectedCategory = EVENT_CATEGORY_GROUPS.find((group) => group.name === category);
  const subcategoryOptions = selectedCategory?.items ?? [];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('');

    if (!startAt || !endAt) {
      setStatus('Please select a start and end time.');
      return;
    }

    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get('title') || ''),
      description: String(form.get('description') || ''),
      venue: String(form.get('venue') || ''),
      city: String(form.get('city') || ''),
      category: category || null,
      subcategory: subcategory || null,
      startAt,
      endAt,
      capacity: Number(form.get('capacity') || 0),
      bannerUrl: bannerUrl || null,
      refundAllowed: form.get('refundAllowed') === 'on',
      refundWindowHours: Number(form.get('refundWindowHours') || 24),
      refundFeePercent: Number(form.get('refundFeePercent') || 0),
    };

    try {
      const response = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setStatus('Event created.');
      setBannerUrl('');
      setStartAt('');
      setEndAt('');
      setCategory('');
      setSubcategory('');
      setFormKey((prev) => prev + 1);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Unable to create event. Check your details and try again.';
      setStatus(message);
    }
  };

  if (!token) {
    return (
      <AuthPrompt
        title="Sign in to create events"
        description="Create your organizer account to draft and publish new events."
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-6 py-16">
      <Link href="/" className="text-xs uppercase tracking-[0.3em] text-emerald-300">
        Back to events
      </Link>

      <header className="space-y-3">
        <h1 className="text-3xl font-semibold">Create a new event</h1>
        <p className="text-sm text-neutral-300">
          Draft now, add ticket types, then publish when ready.
        </p>
      </header>

      {status ? (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs text-emerald-200">{status}</p>
        </section>
      ) : null}

      <form
        key={formKey}
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            Title
            <input
              name="title"
              required
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            City
            <input
              name="city"
              required
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
        </div>
        <label className="flex flex-col gap-2 text-sm">
          Venue
          <input
            name="venue"
            required
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            Category
            <StyledDropdown
              value={category}
              onChange={(value) => {
                setCategory(value);
                setSubcategory('');
              }}
              options={EVENT_CATEGORY_GROUPS.map((group) => ({
                label: group.name,
                value: group.name,
              }))}
              placeholder="Select category"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Subcategory
            <StyledDropdown
              value={subcategory}
              onChange={setSubcategory}
              disabled={!category}
              options={subcategoryOptions.map((item) => ({ label: item, value: item }))}
              placeholder={category ? 'Select subcategory' : 'Choose category first'}
            />
          </label>
        </div>
        <label className="flex flex-col gap-2 text-sm">
          Description
          <textarea
            name="description"
            required
            rows={4}
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Capacity
          <input
            name="capacity"
            type="number"
            min={1}
            required
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
          />
        </label>
        <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              name="refundAllowed"
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-white/20 bg-white/10"
            />
            Allow refunds
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Refund window (hours)
            <input
              name="refundWindowHours"
              type="number"
              min={0}
              defaultValue={24}
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Refund fee (%)
            <input
              name="refundFeePercent"
              type="number"
              min={0}
              max={100}
              defaultValue={0}
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <DateTimePicker label="Start time" value={startAt} onChange={setStartAt} required />
          <DateTimePicker label="End time" value={endAt} onChange={setEndAt} required />
        </div>
        <BannerUploadField token={token} value={bannerUrl} onChange={setBannerUrl} />
        <button
          type="submit"
          className="mt-2 w-fit rounded-full border border-emerald-400/60 px-6 py-2 text-sm text-emerald-200 transition hover:border-emerald-200"
        >
          Save draft
        </button>
      </form>
    </main>
  );
}
