import React, { useEffect, useState } from "react";
import {
  HeartPulse,
  Brain,
  Pill,
  ClipboardCheck,
  Calendar,
  AlertTriangle,
  Bell,
  Activity,
} from "lucide-react";

import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Bar,
  Line
} from "recharts";

import { db } from "../firebase"; // <<--- YOUR FIREBASE CONFIG
import {
  collection,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";

import "../styles/MedicalSummary.css";

export default function MedicalSummary({ userId }) {

  // REALTIME STATE
  const [diagnosis, setDiagnosis] = useState(null);
  const [risk, setRisk] = useState(0);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState([]); // weekly stats

  // ========== FIRESTORE LIVE LISTENERS ==========
  useEffect(() => {
    if (!userId) return;

    const col = (p) => collection(db, "users", userId, p);

    // Diagnosis
    onSnapshot(col("diagnosis"), (snap) => {
      const data = snap.docs.map((d) => d.data());
      setDiagnosis(data[0] || null);
    });

    // Risk Score
    onSnapshot(col("stats"), (snap) => {
      const d = snap.docs.map((x) => x.data());
      if (d[0]) {
        setRisk(d[0].riskScore || 0);
        setStats(d[0].weeklyVisits || []);
      }
    });

    // Prescriptions
    onSnapshot(col("prescriptions"), (snap) => {
      setPrescriptions(snap.docs.map((d) => d.data()));
    });

    // Reminders
    onSnapshot(col("reminders"), (snap) => {
      setReminders(snap.docs.map((d) => d.data().text));
    });

    // Appointments
    onSnapshot(
      query(col("appointments"), orderBy("createdAt", "desc")),
      (snap) => setAppointments(snap.docs.map((d) => d.data()))
    );
  }, [userId]);

  // Default graph if no stats exist
  const weeklyData =
    stats.length > 0
      ? stats
      : [
          { day: "Mon", appts: 0, amount: 0 },
          { day: "Tue", appts: 0, amount: 0 },
          { day: "Wed", appts: 0, amount: 0 },
          { day: "Thu", appts: 0, amount: 0 },
          { day: "Fri", appts: 0, amount: 0 }
        ];

  return (
    <div className="dash-container">

      {/* ======================= HERO ======================= */}
      <div className="dash-hero">

        {/* LEFT SIDE */}
        <div className="hero-left">
          <h1 className="dash-title">AI Health Overview</h1>
          <p className="dash-subtitle">Your complete medical insights powered by MindMate AI.</p>

          {diagnosis && (
            <div className="diagnosis-box">
              <Brain size={26} className="icon-glow" />
              <div>
                <h3>{diagnosis.condition}</h3>
                <p>{diagnosis.summary}</p>
                <span className="updated">Last updated — {diagnosis.updated}</span>
              </div>
            </div>
          )}
        </div>

        {/* RISK SCORE */}
        <div className="risk-card">
          <h3>AI Risk Score</h3>
          <div className="risk-circle">
            <span>{risk}%</span>
          </div>
          <p className="risk-label">{risk < 40 ? "Low Risk" : "Moderate Risk"}</p>
        </div>
      </div>

      {/* ======================= GRID ======================= */}
      <div className="dash-grid">

        {/* LEFT SIDE ============================= */}
        <div className="dash-left">

          {/* Diagnosis Summary */}
          <div className="card large">
            <h2 className="card-title">
              <ClipboardCheck size={20} /> Diagnosis Summary
            </h2>
            <p className="card-text">
              {diagnosis ? diagnosis.summary : "AI has not generated a diagnosis yet."}
            </p>
          </div>

          {/* Prescriptions */}
          <div className="card">
            <h2 className="card-title">
              <Pill size={18} /> Prescriptions
            </h2>
            <ul className="list">
              {prescriptions.length === 0 && <li>No prescriptions yet</li>}
              {prescriptions.map((p, idx) => (
                <li key={idx}>
                  <strong>{p.name}</strong> — {p.dose} ({p.freq})
                </li>
              ))}
            </ul>
          </div>

          {/* Reminders */}
          <div className="card">
            <h2 className="card-title">
              <Bell size={18} /> Follow-Up Reminders
            </h2>
            <ul className="list">
              {reminders.length === 0 && <li>No reminders yet</li>}
              {reminders.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </div>

          {/* Medicine Schedule */}
          <div className="card">
            <h2 className="card-title">
              <Activity size={18} /> Medicine Schedule
            </h2>
            <div className="timeline">
              {prescriptions.length === 0 && <p>No medicines added</p>}
              {prescriptions.map((p, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="dot" />
                  <div>
                    <h4>{p.name}</h4>
                    <p>{p.freq}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE ============================= */}
        <div className="dash-right">

          {/* Appointments */}
          <div className="card">
            <h2 className="card-title">
              <Calendar size={18} /> Upcoming Appointments
            </h2>
            {appointments.length === 0 && <p>No appointments yet</p>}
            {appointments.map((a, idx) => (
              <div key={idx} className="appointment-item">
                <h4>{a.doctor}</h4>
                <p>{a.speciality}</p>
                <span>{a.time}</span>
              </div>
            ))}
          </div>

          {/* Alerts */}
          <div className="card alert">
            <h2 className="card-title">
              <AlertTriangle size={18} /> AI Alerts
            </h2>
            <p>No critical alerts at the moment.</p>
          </div>

          {/* ============ WEEKLY APPOINTMENT GRAPH ============ */}
          <div className="card graph-card">
            <div className="card-title">
              <span>Weekly Appointment Stats</span>
            </div>

            <p className="card-text">AI summary of your consult pattern & spending</p>

            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={weeklyData}>
                <XAxis dataKey="day" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />

                <Bar dataKey="appts" barSize={20} fill="#8b5cff" radius={[6, 6, 0, 0]} />

                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#43e8d8"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#43e8d8" }}
                />

                <Tooltip
                  contentStyle={{
                    background: "rgba(20,20,25,0.8)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    color: "#fff"
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </div>
  );
}
