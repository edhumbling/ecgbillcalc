import React, { useEffect, useRef, useState } from "react";

type Band = { limit: number; rate: number };
type TariffKey = "residential" | "nonResidential";

type CalculationResults = {
  units: number;
  bandBreakdown: { used: number; rate: number; cost: number }[];
  energyCost: number;
  serviceCharge: number;
  natElectLevy: number;
  streetLight: number;
  nhilGetFund: number;
  vat: number;
  totalBill: number;
  adjustment: number;
  payable: number;
};

const initialRates: Record<TariffKey, Band[]> = {
  residential: [
    { limit: 50, rate: 1.4878 },
    { limit: 250, rate: 1.9 },
    { limit: 300, rate: 2.3 },
    { limit: Infinity, rate: 2.5 },
  ],
  nonResidential: [{ limit: Infinity, rate: 1.59 }],
};

export default function ECGBillCalculator() {
  const [prevReading, setPrevReading] = useState<number>(0);
  const [currReading, setCurrReading] = useState<number>(0);
  const [billingDays, setBillingDays] = useState<number>(31);
  const [prevBalance, setPrevBalance] = useState<number>(0);
  const [payments, setPayments] = useState<number>(0);
  const [adjustment, setAdjustment] = useState<number>(0);
  const [tariffType, setTariffType] = useState<TariffKey>("residential");
  const [quickMode, setQuickMode] = useState<boolean>(true);
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [rates, setRates] = useState<Record<TariffKey, Band[]>>(initialRates);
  const [showRateEditor, setShowRateEditor] = useState<boolean>(false);
  const [rememberReadings, setRememberReadings] = useState<boolean>(true);
  const [savedPrevReading, setSavedPrevReading] = useState<number | null>(null);
  const [savedCurrReading, setSavedCurrReading] = useState<number | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const sp = localStorage.getItem("ecg_prev_reading");
      const sc = localStorage.getItem("ecg_curr_reading");
      const sa = localStorage.getItem("ecg_adjustment");
      if (sp !== null && !Number.isNaN(Number(sp))) setSavedPrevReading(Number(sp));
      if (sc !== null && !Number.isNaN(Number(sc))) setSavedCurrReading(Number(sc));
      if (sa !== null && !Number.isNaN(Number(sa))) setAdjustment(Number(sa));
      const sr = localStorage.getItem("ecg_remember");
      if (sr === "false") setRememberReadings(false);
    } catch {}
  }, []);

  const serviceChargeFlat: Record<TariffKey, number> = {
    residential: 2.13,
    nonResidential: 12.43,
  };
  const streetLightRate = 0.03;
  const nelRate = 0.02;
  const nhilGetRate = 0.05;
  const vatRate = 0.15;

  const calculateBill = () => {
    const units = Math.max(currReading - prevReading, 0);
    const bands = rates[tariffType];
    let remaining = units;
    let energyCost = 0;
    const bandBreakdown: { used: number; rate: number; cost: number }[] = [];

    for (const band of bands) {
      if (remaining <= 0) break;
      const used = Math.min(remaining, band.limit);
      const cost = used * band.rate;
      energyCost += cost;
      bandBreakdown.push({ used, rate: band.rate, cost });
      remaining -= used;
    }

    const days = quickMode ? 31 : billingDays;
    const balance = quickMode ? 0 : prevBalance;
    const paid = quickMode ? 0 : payments;
    const adj = quickMode ? 0 : adjustment;

    const streetLight = energyCost * streetLightRate;
    const natElectLevy = energyCost * nelRate;
    const nhilGetFund = tariffType === "nonResidential" ? energyCost * nhilGetRate : 0;
    const vatBase = tariffType === "nonResidential" ? energyCost + streetLight + natElectLevy + nhilGetFund : 0;
    const vat = tariffType === "nonResidential" ? vatBase * vatRate : 0;
    const serviceCharge = serviceChargeFlat[tariffType] * (days / 31);
    const totalBill = energyCost + streetLight + natElectLevy + nhilGetFund + vat + serviceCharge;
    const payable = totalBill + balance - paid + adj;

    setResults({
      units,
      bandBreakdown,
      energyCost,
      serviceCharge,
      natElectLevy,
      streetLight,
      nhilGetFund,
      vat,
      totalBill,
      adjustment: adj,
      payable,
    });

    try {
      if (rememberReadings) {
        localStorage.setItem("ecg_prev_reading", String(prevReading));
        localStorage.setItem("ecg_curr_reading", String(currReading));
        localStorage.setItem("ecg_adjustment", String(adjustment));
        localStorage.setItem("ecg_remember", "true");
        setSavedPrevReading(prevReading);
        setSavedCurrReading(currReading);
      } else {
        localStorage.setItem("ecg_remember", "false");
      }
    } catch {}

    // Smoothly scroll to results after rendering
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const updateBand = (type: TariffKey, index: number, updates: Partial<Band>) => {
    setRates((prev) => {
      const next = { ...prev };
      const arr = [...next[type]];
      const current = arr[index];
      arr[index] = { ...current, ...updates };
      next[type] = arr;
      return next;
    });
  };

  const addBandBeforeInfinity = (type: TariffKey) => {
    setRates((prev) => {
      const next = { ...prev };
      const arr = [...next[type]];
      const infIndex = arr.length - 1;
      arr.splice(infIndex, 0, { limit: 100, rate: 0 });
      next[type] = arr;
      return next;
    });
  };

  const removeBand = (type: TariffKey, index: number) => {
    setRates((prev) => {
      const next = { ...prev };
      const arr = [...next[type]];
      const lastIndex = arr.length - 1;
      if (index >= 0 && index < lastIndex) {
        arr.splice(index, 1);
      }
      next[type] = arr;
      return next;
    });
  };

  const resetRates = () => setRates(initialRates);

  return (
    <div className="min-h-screen py-6 sm:py-10 px-0 sm:px-4 overflow-x-hidden">
      <div className="max-w-5xl mx-auto">
        <div
          className="mb-4 sm:mb-6 rounded-xl p-3 sm:p-4"
          role="note"
          style={{
            background: "rgba(255,204,0,0.16)",
            border: "1px solid rgba(255,204,0,0.35)",
          }}
        >
          <div className="flex items-start gap-3">
            <span className="accent-pill">Note</span>
            <p className="text-sm leading-5 m-0" style={{ color: "var(--foreground)" }}>
              This calculator is for ECG postpaid bills only. It does not apply to prepaid meters.
            </p>
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-6">ECG Bill Calculator</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <section className="glass card rounded-none sm:rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Inputs</h2>

            <div className="mb-4 px-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={quickMode}
                  aria-label="Toggle Quick Mode"
                  onClick={() => setQuickMode(!quickMode)}
                  className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none"
                  style={{ background: quickMode ? "var(--ecg-blue)" : "var(--outline)" }}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${quickMode ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Quick Mode</span>
                    <span className="accent-pill hidden md:inline-block">Fast</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    Enter previous and current kWh only (31 days, no arrears)
                  </p>
                </div>
              </div>
            </div>

            {/* Remember readings toggle */}
            <div className="mb-4 px-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={rememberReadings}
                  aria-label="Remember readings"
                  onClick={() => setRememberReadings(!rememberReadings)}
                  className="relative inline-flex h-6 w-10 items-center rounded-full transition-colors focus:outline-none"
                  style={{ background: rememberReadings ? "var(--ecg-blue)" : "var(--outline)" }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${rememberReadings ? "translate-x-5" : "translate-x-1"}`}
                  />
                </button>
                <div className="flex-1">
                  <span className="text-sm">Remember readings (local)</span>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="prevReading">Previous Reading (kWh)</label>
                <input id="prevReading" type="number" inputMode="decimal" pattern="[0-9]*" value={prevReading} onChange={(e) => setPrevReading(Number(e.target.value))} className="input" />
                {prevReading === 0 && (
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                    {savedPrevReading !== null && (
                      <button type="button" className="btn-soft" onClick={() => setPrevReading(savedPrevReading!)}>
                        Use saved: {savedPrevReading}
                      </button>
                    )}
                    {savedPrevReading === null && savedCurrReading !== null && (
                      <button type="button" className="btn-soft" onClick={() => setPrevReading(savedCurrReading!)}>
                        Use last current: {savedCurrReading}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="label" htmlFor="currReading">Current Reading (kWh)</label>
                <input id="currReading" type="number" inputMode="decimal" pattern="[0-9]*" value={currReading} onChange={(e) => setCurrReading(Number(e.target.value))} className="input" />
              </div>
            </div>

            {!quickMode && (
              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="billingDays">Billing Days</label>
                  <input id="billingDays" type="number" value={billingDays} onChange={(e) => setBillingDays(Number(e.target.value))} className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="prevBalance">Previous Balance (GHS)</label>
                  <input id="prevBalance" type="number" value={prevBalance} onChange={(e) => setPrevBalance(Number(e.target.value))} className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="payments">Payments Made (GHS)</label>
                  <input id="payments" type="number" value={payments} onChange={(e) => setPayments(Number(e.target.value))} className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="adjustment">Adjustments (GHS)</label>
                  <input
                    id="adjustment"
                    type="number"
                    value={adjustment}
                    onChange={(e) => setAdjustment(Number(e.target.value))}
                    className="input"
                  />
                  <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                    Enter positive for surcharge, negative for credit.
                  </p>
                </div>
                <div>
                  <label className="label" htmlFor="tariffType">Tariff Type</label>
                  <select id="tariffType" value={tariffType} onChange={(e) => setTariffType(e.target.value as TariffKey)} className="input bg-white">
                    <option value="residential">Residential</option>
                    <option value="nonResidential">Non-Residential</option>
                  </select>
                </div>
              </div>
            )}

            <div className="mt-6 hidden sm:flex items-center gap-3">
              <button onClick={calculateBill} className="btn-primary">Calculate Bill</button>
              <button onClick={() => { setPrevReading(0); setCurrReading(0); setBillingDays(31); setPrevBalance(0); setPayments(0); setAdjustment(0); setResults(null); }} className="btn-warning">Clear</button>
            </div>

            {/* Mobile action bar: only visible while within the input panel area */}
            <div className="sticky bottom-0 lg:hidden p-3" style={{ background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.08))" }}>
              <div className="max-w-5xl mx-auto flex gap-3">
                <button onClick={calculateBill} className="btn-primary flex-1">Calculate</button>
                <button onClick={() => { setPrevReading(0); setCurrReading(0); setBillingDays(31); setPrevBalance(0); setPayments(0); setAdjustment(0); setResults(null); }} className="btn-warning">Clear</button>
              </div>
            </div>

            <div className="mt-8" style={{ borderTop: "1px solid var(--outline)" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Tariff Rates</h3>
                <button className="text-sm text-blue-600 hover:underline" onClick={() => setShowRateEditor(!showRateEditor)}>
                  {showRateEditor ? "Hide editor" : "Edit rates"}
                </button>
              </div>

              {showRateEditor && (
                <div className="mt-4">
                  <div className="flex items-center gap-3 mb-3 px-1">
                    <span className="text-sm text-gray-600">Editing:</span>
                    <select value={tariffType} onChange={(e) => setTariffType(e.target.value as TariffKey)} className="input bg-white text-center">
                      <option value="residential">Residential</option>
                      <option value="nonResidential">Non-Residential</option>
                    </select>
                    <button onClick={() => addBandBeforeInfinity(tariffType)} className="ml-auto btn-soft">Add band</button>
                    <button onClick={resetRates} className="btn-soft">Reset</button>
                  </div>

                  <div className="space-y-3">
                    {rates[tariffType].map((band, index) => {
                      const isInfinity = band.limit === Infinity;
                      return (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center glass p-3 rounded-none sm:rounded-xl">
                          <div className="md:col-span-4 col-span-full">
                            <label className="label">Limit (kWh)</label>
                            {isInfinity ? (
                              <div className="px-3 py-2 h-[44px] flex items-center justify-center input" style={{ background: "var(--surface)", color: "var(--muted)" }}>∞</div>
                            ) : (
                              <input type="number" value={Number.isFinite(band.limit) ? band.limit : 0} onChange={(e) => updateBand(tariffType, index, { limit: Number(e.target.value) })} className="input text-center" />
                            )}
                          </div>
                          <div className="md:col-span-4 col-span-full">
                            <label className="label">Rate (GHS/kWh)</label>
                            <input type="number" step="0.0001" value={band.rate} onChange={(e) => updateBand(tariffType, index, { rate: Number(e.target.value) })} className="input text-center" />
                          </div>
                          <div className="md:col-span-4 col-span-full flex md:justify-end">
                            <button disabled={isInfinity} onClick={() => removeBand(tariffType, index)} className={`btn-danger-soft ${isInfinity ? "opacity-40 cursor-not-allowed" : ""}`}>Remove</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section ref={resultsRef} className="glass card rounded-none sm:rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Results</h2>

            {!results ? (
              <p className="text-gray-500 text-sm">Enter values and click Calculate.</p>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="border rounded-xl p-3">
                  <div className="text-xs text-gray-500 break-words">Units</div>
                    <div className="text-xl font-semibold">{results.units} kWh</div>
                  </div>
                  <div className="border rounded-xl p-3">
                    <div className="text-xs text-gray-500 break-words">Energy Cost</div>
                    <div className="text-xl font-semibold">GHS {results.energyCost.toFixed(2)}</div>
                  </div>
                  <div className="border rounded-xl p-3">
                    <div className="text-xs text-gray-500 break-words">Service Charge</div>
                    <div className="text-xl font-semibold">GHS {results.serviceCharge.toFixed(2)}</div>
                  </div>
                  <div className="border rounded-xl p-3">
                  <div className="text-xs text-gray-500 break-words">Total Bill</div>
                    <div className="text-xl font-semibold">GHS {results.totalBill.toFixed(2)}</div>
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="break-words">Nat&#39;l Elect Levy (2%)</span>
                    <span>GHS {results.natElectLevy.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="break-words">Street Light (3%)</span>
                    <span>GHS {results.streetLight.toFixed(2)}</span>
                  </div>
                  {!quickMode && (
                    <div className="flex justify-between">
                      <span className="break-words">Adjustments</span>
                      <span>GHS {results.adjustment.toFixed(2)}</span>
                    </div>
                  )}
                  {tariffType === "nonResidential" && (
                    <>
                      <div className="flex justify-between">
                        <span className="break-words">NHIL & GETFund (5%)</span>
                        <span>GHS {results.nhilGetFund.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="break-words">VAT (15%)</span>
                        <span>GHS {results.vat.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-4 rounded-xl" style={{ background: "linear-gradient(180deg, rgba(0,51,161,0.10), rgba(0,51,161,0.06))", border: "1px solid var(--outline)" }}>
                  <div className="text-sm" style={{ color: "var(--muted)" }}>Final Amount Payable</div>
                  <div className="text-2xl font-bold final-amount">GHS {results.payable.toFixed(2)}</div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-2">Band Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm rounded-xl overflow-hidden" style={{ border: "1px solid var(--outline)", tableLayout: "fixed" }}>
                      <thead style={{ background: "var(--surface)" }}>
                        <tr>
                          <th className="text-left p-2 break-words" style={{ borderBottom: "1px solid var(--outline)" }}>Units (kWh)</th>
                          <th className="text-left p-2 break-words" style={{ borderBottom: "1px solid var(--outline)" }}>Rate (GHS/kWh)</th>
                          <th className="text-left p-2 break-words" style={{ borderBottom: "1px solid var(--outline)" }}>Cost (GHS)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.bandBreakdown.map((b, i) => (
                          <tr key={i}>
                            <td className="p-2 break-words" style={{ borderTop: "1px solid var(--outline)" }}>{b.used}</td>
                            <td className="p-2 break-words" style={{ borderTop: "1px solid var(--outline)" }}>{b.rate.toFixed(4)}</td>
                            <td className="p-2 break-words" style={{ borderTop: "1px solid var(--outline)" }}>{b.cost.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}


