import React from 'react'

const Footer = () => {
  return (
    <div>
          <footer className="bg-[#0f0f0f] border-t border-[#1f1f1f]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <h3 className="text-white font-semibold text-lg">MIS–GIS Capstone • DA x LGU Jasaan</h3>
                  <p className="mt-2 text-gray-400 text-sm">
                    Municipal agriculture registry, parcel mapping, and program analytics to support
                    data‑driven planning and service delivery.
                  </p>
                  <div className="mt-4 flex items-center gap-3 text-sm text-gray-400">
                    <span className="inline-flex items-center gap-2">
                      <i className="fas fa-map-marker-alt text-green-500"></i> Jasaan, Misamis Oriental
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <i className="fas fa-seedling text-green-500"></i> Department of Agriculture
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-white font-semibold">Data & Sources</h4>
                  <ul className="mt-3 space-y-2 text-sm text-gray-400">
                    <li className="flex gap-2">
                      <i className="fas fa-database mt-0.5 text-blue-400"></i>
                      <span>RSBSA registry, municipal profiles, program beneficiaries</span>
                    </li>
                    <li className="flex gap-2">
                      <i className="fas fa-map mt-0.5 text-emerald-400"></i>
                      <span>Parcels & layers from municipal GIS, PSA, DA Regional datasets</span>
                    </li>
                    <li className="flex gap-2">
                      <i className="fas fa-shield-alt mt-0.5 text-yellow-400"></i>
                      <span>Privacy: aggregated indicators; PII stored securely per Data Privacy Act</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-semibold">Contacts</h4>
                  <ul className="mt-3 space-y-2 text-sm text-gray-400">
                    <li className="flex gap-2">
                      <i className="fas fa-building mt-0.5 text-gray-400"></i>
                      <span>Municipal Agriculture Office (MAO), LGU Jasaan</span>
                    </li>
                    <li className="flex gap-2">
                      <i className="fas fa-envelope mt-0.5 text-gray-400"></i>
                      <span>mao@jasaan.gov.ph</span>
                    </li>
                    <li className="flex gap-2">
                      <i className="fas fa-phone mt-0.5 text-gray-400"></i>
                      <span>(+63) 999-123-4567</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 border-t border-[#1f1f1f] pt-4 text-xs text-gray-500 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>© {new Date().getFullYear()} LGU Jasaan • Department of Agriculture. For planning and research use.</div>
                <div className="flex items-center gap-4">
                  <span>Build v0.1.0</span>
                  <span className="inline-flex items-center gap-2">
                    <i className="fas fa-chart-line"></i> Analytics & GIS‑ready
                  </span>
                </div>
              </div>
            </div>
          </footer>
    </div>
  )
}

export default Footer