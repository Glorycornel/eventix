'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDateRange } from '../lib/format';
import { AuthLink } from './AuthLink';
import { SavedToggleButton } from './SavedToggleButton';

export type EventItem = {
  id: string;
  title: string;
  description: string;
  city: string;
  venue: string;
  startAt: string;
  endAt: string;
  bannerUrl: string | null;
};

type GeoStatus = 'idle' | 'loading' | 'error';
type SuggestionStatus = 'idle' | 'loading' | 'error';

type LocationSuggestion = {
  city: string;
  label: string;
};

type DiscoverContentProps = {
  events: EventItem[];
};

export function DiscoverContent({ events }: DiscoverContentProps) {
  const [locationCity, setLocationCity] = useState('London');
  const [locationLabel, setLocationLabel] = useState('London');
  const [inputValue, setInputValue] = useState('London');
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle');
  const [suggestionStatus, setSuggestionStatus] = useState<SuggestionStatus>('idle');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const lastRequestId = useRef(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('any');
  const [customDate, setCustomDate] = useState('');
  const customDateRef = useRef<HTMLInputElement | null>(null);
  const [neighborhoodsExpanded, setNeighborhoodsExpanded] = useState(false);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [freeOnly, setFreeOnly] = useState(false);
  const [eventType, setEventType] = useState('any');
  const [sortBy, setSortBy] = useState('relevance');

  const neighborhoodOptions = [
    'Soho',
    'Shoreditch',
    'Camden',
    'Chelsea',
    'Greenwich',
    'Hackney',
    'Notting Hill',
    'Southbank',
    'Islington',
    'Kensington',
    'Brixton',
    'Canary Wharf',
  ];

  const categoryGroups = [
    { name: 'Music', items: ['Latin', 'Pop', 'Cultural', 'Afro', 'Jazz', 'Electronic'] },
    { name: 'Business', items: ['Career', 'Real Estate', 'Tech', 'Media', 'Finance'] },
    { name: 'Fashion', items: ['Runway', 'Streetwear', 'Sustainable', 'Luxury'] },
    { name: 'Hobbies', items: ['Gaming', 'Photography', 'Crafts', 'Writing'] },
    { name: 'Health', items: ['Wellness', 'Yoga', 'Fitness', 'Mindfulness'] },
    { name: 'Food & Drink', items: ['Tastings', 'Pop-ups', 'Nightlife', 'Dining'] },
    { name: 'Performing & Visual Arts', items: ['Theatre', 'Dance', 'Exhibitions'] },
    { name: 'Community', items: ['Meetups', 'Volunteering', 'Local Markets'] },
    { name: 'Sports', items: ['Football', 'Basketball', 'Running', 'Cycling'] },
  ];

  const hasFilters =
    dateFilter !== 'any' ||
    selectedNeighborhoods.length > 0 ||
    selectedCategories.length > 0 ||
    freeOnly ||
    eventType !== 'any' ||
    sortBy !== 'relevance';

  useEffect(() => {
    const saved = window.localStorage.getItem('eventix:location');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { city?: string; label?: string };
        if (parsed.city) {
          setLocationCity(parsed.city);
          setLocationLabel(parsed.label ?? parsed.city);
          setInputValue(parsed.label ?? parsed.city);
        }
      } catch {
        setLocationCity(saved);
        setLocationLabel(saved);
        setInputValue(saved);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      'eventix:location',
      JSON.stringify({ city: locationCity, label: locationLabel }),
    );
  }, [locationCity, locationLabel]);

  const filteredEvents = useMemo(() => {
    const normalized = locationCity.trim().toLowerCase();
    if (!normalized) {
      return events;
    }
    return events.filter((event) => event.city?.toLowerCase() === normalized);
  }, [events, locationCity]);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            {
              headers: { Accept: "application/json" },
            },
          );
          if (!response.ok) {
            throw new Error('Failed to resolve location');
          }
          const data = await response.json();
          const address = data.address ?? {};
          const city =
            address.city ||
            address.town ||
            address.village ||
            address.municipality ||
            address.county ||
            address.state;
          const state = address.state || address.region || address.county;
          const country = address.country;
          if (city) {
            const label = [city, state, country].filter(Boolean).join(", ");
            setLocationCity(city);
            setLocationLabel(label);
            setInputValue(label);
            setGeoStatus('idle');
          } else {
            setGeoStatus('error');
          }
        } catch {
          setGeoStatus('error');
        }
      },
      () => setGeoStatus('error'),
      { timeout: 8000 },
    );
  };

  useEffect(() => {
    const trimmed = inputValue.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setSuggestionStatus('idle');
      return;
    }

    const requestId = ++lastRequestId.current;
    setSuggestionStatus('loading');
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&accept-language=en&q=${encodeURIComponent(
            trimmed,
          )}`,
          { headers: { Accept: 'application/json' } },
        );
        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }
        const results = (await response.json()) as Array<{
          address?: Record<string, string>;
          display_name?: string;
        }>;
        if (requestId !== lastRequestId.current) {
          return;
        }
        const mapped = results
          .map((item) => {
            const address = item.address ?? {};
            const city =
              address.city ||
              address.town ||
              address.village ||
              address.municipality ||
              address.hamlet ||
              address.county ||
              address.state;
            const state = address.state || address.region || address.county;
            const country = address.country;
            if (!city) {
              return null;
            }
            const label = [city, state, country].filter(Boolean).join(", ");
            return { city, label };
          })
          .filter((item): item is LocationSuggestion => Boolean(item));
        setSuggestions(mapped);
        setSuggestionStatus('idle');
      } catch {
        if (requestId !== lastRequestId.current) {
          return;
        }
        setSuggestionStatus('error');
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [inputValue]);

  return (
    <>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex w-full items-center">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder="Find things to do"
                className="h-12 w-full rounded-full border border-white/10 bg-neutral-950/80 pl-5 pr-12 text-sm text-white/90 outline-none transition focus:border-emerald-300/60"
              />
              <button
                type="button"
                aria-label="Open filters"
                onClick={() => setFiltersOpen(true)}
                className={`absolute right-1 flex h-10 w-10 items-center justify-center rounded-full border transition ${
                  hasFilters
                    ? "border-emerald-300/60 bg-emerald-300/10 text-emerald-100"
                    : "border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M4 6h16M7 12h10M10 18h4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSearchOpen((prev) => !prev)}
              className="text-xs uppercase tracking-[0.3em] text-neutral-400 md:text-right"
            >
              {searchOpen ? "Close" : "Explore"} search
            </button>
          </div>

          {searchOpen && (
            <div className="grid gap-4 rounded-2xl border border-white/10 bg-neutral-950/80 p-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Recent search</p>
                <div className="mt-2 flex flex-wrap gap-2 text-neutral-300">
                  <span className="rounded-full border border-white/10 px-3 py-1">
                    rooftop jazz
                  </span>
                  <span className="rounded-full border border-white/10 px-3 py-1">
                    tech meetup
                  </span>
                  <span className="rounded-full border border-white/10 px-3 py-1">art walk</span>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Trending</p>
                <div className="mt-2 flex flex-wrap gap-2 text-neutral-300">
                  <span className="rounded-full border border-white/10 px-3 py-1">
                    open air cinema
                  </span>
                  <span className="rounded-full border border-white/10 px-3 py-1">
                    food pop-up
                  </span>
                  <span className="rounded-full border border-white/10 px-3 py-1">
                    latin nights
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleUseLocation}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 transition hover:border-white/40 hover:text-white"
              aria-label="Use my location"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                <path
                  d="M12 3a8 8 0 0 1 8 8c0 5-5.2 9.8-8 11.5C9.2 20.8 4 16 4 11a8 8 0 0 1 8-8Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <circle cx="12" cy="11" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Location</p>
              <div className="text-xl font-semibold">{locationLabel}</div>
              <p className="text-xs text-neutral-400">
                Share your location to auto-set it for discover.
              </p>
            </div>
          </div>
          <div className="relative flex w-full flex-col gap-2 sm:max-w-xs sm:items-end">
            <label className="text-xs uppercase tracking-[0.3em] text-neutral-400">
              Set manually
            </label>
            <input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    setLocationCity(inputValue.trim() || locationCity);
                    setLocationLabel(inputValue.trim() || locationLabel);
                    setSuggestions([]);
                  }
                }}
              placeholder="Start typing a city..."
              className="w-full rounded-full border border-white/10 bg-neutral-950/80 px-4 py-2 text-sm text-white/90"
            />
            {inputValue.trim().length >= 2 && (
              <div className="absolute right-0 top-[4.75rem] z-20 w-full rounded-2xl border border-white/10 bg-neutral-950/95 p-2 shadow-xl shadow-black/40">
                {suggestionStatus === 'loading' && (
                  <div className="px-3 py-2 text-xs text-neutral-400">Searching cities...</div>
                )}
                {suggestionStatus === 'error' && (
                  <div className="px-3 py-2 text-xs text-rose-200">
                    Couldn&apos;t load suggestions.
                  </div>
                )}
                {suggestionStatus === 'idle' && suggestions.length === 0 && (
                  <div className="px-3 py-2 text-xs text-neutral-400">No matches yet.</div>
                )}
                {suggestions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => {
                      setLocationCity(option.city);
                      setLocationLabel(option.label);
                      setInputValue(option.label);
                      setSuggestions([]);
                    }}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
            {geoStatus === 'loading' && (
              <span className="text-xs text-emerald-200">Finding your location...</span>
            )}
            {geoStatus === 'error' && (
              <span className="text-xs text-rose-200">
                Couldn&apos;t detect location. Pick a city instead.
              </span>
            )}
          </div>
        </div>
      </section>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-neutral-950/95 p-6 text-white shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">Filters</p>
                <h3 className="text-2xl font-semibold">Refine discover</h3>
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl"
              >
                &times;
              </button>
            </div>

            <div className="mt-6 grid gap-6">
              <div>
                <p className="text-sm font-semibold">Date</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[
                    { value: 'any', label: 'Any date' },
                    { value: 'today', label: 'Today' },
                    { value: 'tomorrow', label: 'Tomorrow' },
                    { value: 'week', label: 'This week' },
                    { value: 'weekend', label: 'This weekend' },
                    { value: 'custom', label: 'Choose a date' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${
                        dateFilter === option.value
                          ? 'border-emerald-300/60 bg-emerald-300/10 text-emerald-100'
                          : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30'
                      }`}
                      onClick={() => {
                        if (option.value === 'custom') {
                          setDateFilter('custom');
                          requestAnimationFrame(() => {
                            customDateRef.current?.focus();
                          });
                        }
                      }}
                    >
                      <input
                        type="radio"
                        name="dateFilter"
                        value={option.value}
                        checked={dateFilter === option.value}
                        onChange={() => setDateFilter(option.value)}
                        className="h-4 w-4 accent-emerald-300"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    ref={customDateRef}
                    type="date"
                    value={customDate}
                    onChange={(event) => setCustomDate(event.target.value)}
                    onFocus={() => setDateFilter('custom')}
                    disabled={dateFilter !== 'custom'}
                    className={`w-full rounded-2xl border px-4 py-2 text-sm ${
                      dateFilter === 'custom'
                        ? 'border-white/10 bg-neutral-950/80 text-white/80'
                        : 'cursor-not-allowed border-white/5 bg-neutral-950/40 text-white/30'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setCustomDate('')}
                    disabled={dateFilter !== 'custom' || !customDate}
                    className={`h-10 rounded-full border px-4 text-xs uppercase tracking-[0.2em] ${
                      dateFilter === 'custom' && customDate
                        ? 'border-white/10 text-white/70 hover:border-white/30 hover:text-white'
                        : 'cursor-not-allowed border-white/5 text-white/30'
                    }`}
                  >
                    Clear
                  </button>
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  Choose from the calendar or type a date manually.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Neighborhood</p>
                  <button
                    type="button"
                    onClick={() => setNeighborhoodsExpanded((prev) => !prev)}
                    className="text-xs uppercase tracking-[0.3em] text-neutral-400"
                  >
                  {neighborhoodsExpanded ? 'Show less' : 'Show all'}
                </button>
              </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(neighborhoodsExpanded
                    ? neighborhoodOptions
                    : neighborhoodOptions.slice(0, 6)
                  ).map((item) => (
                    <label
                      key={item}
                      className="flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 transition hover:border-white/30"
                    >
                      <input
                        type="checkbox"
                        checked={selectedNeighborhoods.includes(item)}
                        onChange={(event) => {
                          setSelectedNeighborhoods((prev) =>
                            event.target.checked
                              ? [...prev, item]
                              : prev.filter((value) => value !== item),
                          );
                        }}
                        className="h-4 w-4 accent-emerald-300"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold">Category</p>
                <div className="mt-3 grid gap-3">
                  {categoryGroups.map((group) => (
                    <details
                      key={group.name}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <summary className="cursor-pointer text-sm font-medium text-white/80">
                        {group.name}
                      </summary>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {group.items.map((item) => (
                          <label
                            key={item}
                            className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-neutral-950/70 px-3 py-2 text-sm text-white/70 transition hover:border-white/30"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(item)}
                              onChange={(event) => {
                                setSelectedCategories((prev) =>
                                  event.target.checked
                                    ? [...prev, item]
                                    : prev.filter((value) => value !== item),
                                );
                              }}
                              className="h-4 w-4 accent-emerald-300"
                            />
                            {item}
                          </label>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold">Ticket price</p>
                  <label className="mt-3 flex items-center justify-between text-sm text-white/70">
                    Only free events
                    <input
                      type="checkbox"
                      checked={freeOnly}
                      onChange={(event) => setFreeOnly(event.target.checked)}
                      className="h-5 w-5 accent-emerald-300"
                    />
                  </label>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold">Event type</p>
                  <div className="mt-3 grid gap-2">
                  {[
                      { value: 'any', label: 'Any' },
                      { value: 'online', label: 'Online / Virtual' },
                      { value: 'physical', label: 'Physical' },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center gap-2 text-sm text-white/70">
                        <input
                          type="radio"
                          name="eventType"
                          value={option.value}
                          checked={eventType === option.value}
                          onChange={() => setEventType(option.value)}
                          className="h-4 w-4 accent-emerald-300"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">Sort by</p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/70">
                  {[
                    { value: 'relevance', label: 'Relevance' },
                    { value: 'date', label: 'Date' },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="sortBy"
                        value={option.value}
                        checked={sortBy === option.value}
                        onChange={() => setSortBy(option.value)}
                        className="h-4 w-4 accent-emerald-300"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setDateFilter('any');
                  setCustomDate('');
                  setSelectedNeighborhoods([]);
                  setSelectedCategories([]);
                  setFreeOnly(false);
                  setEventType('any');
                  setSortBy('relevance');
                }}
                className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/70 hover:border-white/30"
              >
                Reset filters
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-full border border-emerald-300/60 bg-emerald-300/10 px-6 py-2 text-sm text-emerald-100"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Ticket access</p>
          <h2 className="text-2xl font-semibold">Keep your tickets close</h2>
          <p className="text-sm text-neutral-300">
            Sign in to view your booked tickets and their QR codes anytime.
          </p>
          <AuthLink
            href="/me/tickets"
            className="inline-flex w-full justify-center rounded-full border border-emerald-400/60 px-4 py-2 text-sm text-emerald-200 transition hover:border-emerald-200 sm:w-auto"
            intent="Sign in to view your tickets."
          >
            My tickets
          </AuthLink>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {filteredEvents.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-neutral-300">
            No events currently listed in {locationLabel}.
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-emerald-300/60"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-transparent to-sky-400/10 opacity-0 transition group-hover:opacity-100" />
              <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">{event.city}</p>
                  <SavedToggleButton eventId={event.id} />
                </div>
                <Link href={`/events/${event.id}`} className="space-y-2">
                  <h2 className="text-2xl font-semibold">{event.title}</h2>
                  <p className="text-sm text-neutral-300 line-clamp-2">{event.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                    <span>{event.venue}</span>
                    <span>-</span>
                    <span>{formatDateRange(event.startAt, event.endAt)}</span>
                  </div>
                </Link>
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
