// src/components/JournalTile.jsx
import React from "react";

const JournalTile = ({ entry, onExpand }) => (
  <div className="journal-tile" onClick={() => onExpand(entry)}>
    <span className="brick-date">{entry.date}</span>
    <p>{entry.text.length > 80 ? entry.text.slice(0, 80) + "..." : entry.text}</p>
  </div>
);

export default JournalTile;
