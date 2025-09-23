import React, { useState } from "react";

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
  payable: number;
};

const initialRates: Record<TariffKey, Band[]> = {
  residential: [
    { limit: 50, rate: 1.4878 },
    { limit: 250, rate: 1.9 },
    { limit: 300, rate: 2.3 },
    { limit: Infinity, rate: 2.5 },
  ],
  // May 2025 reckoner shows a flat energy rate for non-residential around 1.59 GHS/kWh
  nonResidential: [
    { limit: Infinity, rate: 1.59 },
  ],
};

export default function ECGBillCalculator() {
  const [prevReading, setPrevReading] = useState<number>(0);
  const [currReading, setCurrReading] = useState<number>(0);
  const [billingDays, setBillingDays] = useState<number>(31);
  const [prevBalance, setPrevBalance] = useState<number>(0);
  const [payments, setPayments] = useState<number>(0);
  const [tariffType, setTariffType] = useState<TariffKey>("residential");
  const [quickMode, setQuickMode] = useState<boolean>(true);
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [rates, setRates] = useState<Record<TariffKey, Band[]>>(initialRates);
  const [showRateEditor, setShowRateEditor] = useState<boolean>(false);

  // ECG May 2025 levy model (from reckoner):
  // - Service charge: flat monthly charge (scaled by billing days)
  // - Street Light: 3% of energy cost
  // - Nat'l Elect Levy (NEL): 2% of energy cost
  // - NHIL & GETFund: 5% of energy cost (Non-Residential only)
  // - VAT (15%): applied on (energy + street light + NEL + NHIL&GET) (Non-Residential only)
  const serviceChargeFlat: Record<TariffKey, number> = {
    residential: 2.13,
    nonResidential: 12.43,
  };
  const streetLightRate = 0.03;
  const nelRate = 0.02;
  const nhilGetRate = 0.05; // non-res only
  const vatRate = 0.15; // non-res only

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

    const streetLight = energyCost * streetLightRate;
    const natElectLevy = energyCost * nelRate;
    const nhilGetFund =
      tariffType === "nonResidential" ? energyCost * nhilGetRate : 0;
    const vatBase =
      tariffType === "nonResidential"
        ? energyCost + streetLight + natElectLevy + nhilGetFund
        : 0;
    const vat = tariffType === "nonResidential" ? vatBase * vatRate : 0;
    const serviceCharge = serviceChargeFlat[tariffType] * (days / 31);
    const totalBill =
      energyCost + streetLight + natElectLevy + nhilGetFund + vat + serviceCharge;
    const payable = totalBill + balance - paid;

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
      payable,
    });
  };

  const updateBand = (
    type: TariffKey,
    index: number,
    updates: Partial<Band>
  ) => {
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
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">ECG Bill Calculator</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white border rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Inputs</h2>

            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={quickMode}
                  onChange={() => setQuickMode(!quickMode)}
                />
                <span>Quick Mode</span>
              </label>
              <span className="text-sm text-gray-500">
                Only previous and current readings (assumes 31 days, no arrears)
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="prevReading">
                  Previous Reading (kWh)
                </label>
                <input
                  id="prevReading"
                  type="number"
                  value={prevReading}
                  onChange={(e) => setPrevReading(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="currReading">
                  Current Reading (kWh)
                </label>
                <input
                  id="currReading"
                  type="number"
                  value={currReading}
                  onChange={(e) => setCurrReading(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

            {!quickMode && (
              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="billingDays">
                    Billing Days
                  </label>
                  <input
                    id="billingDays"
                    type="number"
                    value={billingDays}
                    onChange={(e) => setBillingDays(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="prevBalance">
                    Previous Balance (GHS)
                  </label>
                  <input
                    id="prevBalance"
                    type="number"
                    value={prevBalance}
                    onChange={(e) => setPrevBalance(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="payments">
                    Payments Made (GHS)
                  </label>
                  <input
                    id="payments"
                    type="number"
                    value={payments}
                    onChange={(e) => setPayments(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="tariffType">
                    Tariff Type
                  </label>
                  <select
                    id="tariffType"
                    value={tariffType}
                    onChange={(e) => setTariffType(e.target.value as TariffKey)}
                    className="w-full border rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="residential">Residential</option>
                    <option value="nonResidential">Non-Residential</option>
                  </select>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={calculateBill}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Calculate Bill
              </button>
              <button
                onClick={() => {
                  setPrevReading(0);
                  setCurrReading(0);
                  setBillingDays(31);
                  setPrevBalance(0);
                  setPayments(0);
                  setResults(null);
                }}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
              >
                Clear
              </button>
            </div>

            <div className="mt-8 border-t pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Tariff Rates</h3>
                <button
                  className="text-sm text-blue-600 hover:underline"
                  onClick={() => setShowRateEditor(!showRateEditor)}
                >
                  {showRateEditor ? "Hide editor" : "Edit rates"}
                </button>
              </div>

              {showRateEditor && (
                <div className="mt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm text-gray-600">Editing:</span>
                    <select
                      value={tariffType}
                      onChange={(e) => setTariffType(e.target.value as TariffKey)}
                      className="border rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="residential">Residential</option>
                      <option value="nonResidential">Non-Residential</option>
                    </select>
                    <button
                      onClick={() => addBandBeforeInfinity(tariffType)}
                      className="ml-auto px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50"
                    >
                      Add band
                    </button>
                    <button
                      onClick={resetRates}
                      className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50"
                    >
                      Reset to defaults
                    </button>
                  </div>

                  <div className="space-y-3">
                    {rates[tariffType].map((band, index) => {
                      const isInfinity = band.limit === Infinity;
                      return (
                        <div
                          key={index}
                          className="grid grid-cols-12 gap-3 items-end bg-gray-50 border rounded-xl p-3"
                        >
                          <div className="col-span-5">
                            <label className="block text-sm font-medium mb-1">
                              Limit (kWh)
                            </label>
                            {isInfinity ? (
                              <div className="px-3 py-2 h-[38px] flex items-center border rounded-lg bg-gray-100 text-gray-500">
                                ∞
                              </div>
                            ) : (
                              <input
                                type="number"
                                value={Number.isFinite(band.limit) ? band.limit : 0}
                                onChange={(e) =>
                                  updateBand(tariffType, index, {
                                    limit: Number(e.target.value),
                                  })
                                }
                                className="w-full border rounded-lg px-3 py-2"
                              />
                            )}
                          </div>
                          <div className="col-span-5">
                            <label className="block text-sm font-medium mb-1">
                              Rate (GHS/kWh)
                            </label>
                            <input
                              type="number"
                              step="0.0001"
                              value={band.rate}
                              onChange={(e) =>
                                updateBand(tariffType, index, {
                                  rate: Number(e.target.value),
                                })
                              }
                              className="w-full border rounded-lg px-3 py-2"
                            />
                          </div>
                          <div className="col-span-2">
                            <button
                              disabled={isInfinity}
                              onClick={() => removeBand(tariffType, index)}
                              className={`w-full px-3 py-2 rounded-lg border ${
                                isInfinity
                                  ? "opacity-40 cursor-not-allowed"
                                  : "hover:bg-gray-100"
                              }`}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white border rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Results</h2>

            {!results ? (
              <p className="text-gray-500 text-sm">Enter values and click Calculate.</p>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="border rounded-xl p-3">
                    <div className="text-xs text-gray-500">Units</div>
                    <div className="text-xl font-semibold">{results.units} kWh</div>
                  </div>
                  <div className="border rounded-xl p-3">
                    <div className="text-xs text-gray-500">Energy Cost</div>
                    <div className="text-xl font-semibold">GHS {results.energyCost.toFixed(2)}</div>
                  </div>
                  <div className="border rounded-xl p-3">
                    <div className="text-xs text-gray-500">Service Charge</div>
                    <div className="text-xl font-semibold">GHS {results.serviceCharge.toFixed(2)}</div>
                  </div>
                  <div className="border rounded-xl p-3">
                    <div className="text-xs text-gray-500">Total Bill</div>
                    <div className="text-xl font-semibold">GHS {results.totalBill.toFixed(2)}</div>
                  </div>
                </div>

            <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                <span>Nat'l Elect Levy (2%)</span>
                <span>GHS {results.natElectLevy.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                <span>Street Light (3%)</span>
                    <span>GHS {results.streetLight.toFixed(2)}</span>
                  </div>
              {tariffType === "nonResidential" && (
                <>
                  <div className="flex justify-between">
                    <span>NHIL & GETFund (5%)</span>
                    <span>GHS {results.nhilGetFund.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (15%)</span>
                    <span>GHS {results.vat.toFixed(2)}</span>
                  </div>
                </>
              )}
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="text-sm text-blue-700">Final Amount Payable</div>
                  <div className="text-2xl font-bold text-blue-800">GHS {results.payable.toFixed(2)}</div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-2">Band Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border rounded-xl overflow-hidden">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2 border">Units (kWh)</th>
                          <th className="text-left p-2 border">Rate (GHS/kWh)</th>
                          <th className="text-left p-2 border">Cost (GHS)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.bandBreakdown.map((b, i) => (
                          <tr key={i} className="odd:bg-white even:bg-gray-50">
                            <td className="p-2 border">{b.used}</td>
                            <td className="p-2 border">{b.rate.toFixed(4)}</td>
                            <td className="p-2 border">{b.cost.toFixed(2)}</td>
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


