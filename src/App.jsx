import React, { useState, useEffect } from "react";
import axios from "axios";

export default function App() {
  const [schemas, setSchemas] = useState({});
  const [tableName, setTableName] = useState("");
  const [columns, setColumns] = useState("");
  const [message, setMessage] = useState("");

  const [factTable, setFactTable] = useState("");
  const [sourceTables, setSourceTables] = useState([]);
  const [mappings, setMappings] = useState({});
  const [newFactCol, setNewFactCol] = useState("");
  const [newMapping, setNewMapping] = useState("");
  const [sql, setSql] = useState("");

  // Load schemas
  useEffect(() => {
    loadSchemas();
  }, []);

  const loadSchemas = async () => {
    const res = await axios.get("/api/schemas");
    setSchemas(res.data);
  };

  // Add schema
  const addSchema = async () => {
    try {
      const cols = Object.fromEntries(
        columns.split(",").map((c) => {
          const [name, type] = c.trim().split(" ");
          return [name, type];
        })
      );
      const res = await axios.post("/api/schemas", {
        name: tableName,
        columns: cols,
      });
      setMessage(res.data.message);
      setTableName("");
      setColumns("");
      await loadSchemas();
    } catch (err) {
      setMessage("❌ Error adding schema");
    }
  };

  // Toggle source table selection
  const toggleSource = (table) => {
    setSourceTables((prev) =>
      prev.includes(table) ? prev.filter((t) => t !== table) : [...prev, table]
    );
  };

  // Add mapping
  const addMapping = () => {
    if (!newFactCol || !newMapping) return;
    setMappings((prev) => ({ ...prev, [newFactCol]: newMapping }));
    setNewFactCol("");
    setNewMapping("");
  };

  // Generate MERGE SQL
  const generateMerge = async () => {
    try {
      const res = await axios.post("/api/generate-merge", {
        db_type: "postgresql",
        sources: sourceTables,
        fact: factTable,
        mappings,
        match_keys: Object.keys(mappings).slice(0, 1), // just pick first as match key
      });
      setSql(res.data.sql);
    } catch (err) {
      setSql("❌ Error generating SQL");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>📊 Merge Builder UI</h2>

      {/* Add Schema */}
      <h3>Add Schema</h3>
      <input
        placeholder="Table name"
        value={tableName}
        onChange={(e) => setTableName(e.target.value)}
      />
      <input
        placeholder="Columns (e.g. id INT, name VARCHAR(50))"
        value={columns}
        onChange={(e) => setColumns(e.target.value)}
        style={{ width: "400px" }}
      />
      <button onClick={addSchema}>Add Schema</button>
      {message && <p>{message}</p>}

      {/* Show schemas */}
      <h3>Available Schemas</h3>
      <pre>{JSON.stringify(schemas, null, 2)}</pre>

      {/* Fact Table Input */}
      <h3>Configure Merge</h3>
      <input
        placeholder="Fact Table Name"
        value={factTable}
        onChange={(e) => setFactTable(e.target.value)}
        style={{ width: "300px" }}
      />

      {/* Source Selection */}
      <div>
        <p>Source Tables:</p>
        {Object.keys(schemas).map((t) => (
          <label key={t} style={{ marginRight: "10px" }}>
            <input
              type="checkbox"
              checked={sourceTables.includes(t)}
              onChange={() => toggleSource(t)}
            />
            {t}
          </label>
        ))}
      </div>

      {/* Column Mappings */}
      <h4>Column Mappings</h4>
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <input
          placeholder="Fact Column"
          value={newFactCol}
          onChange={(e) => setNewFactCol(e.target.value)}
        />
        <input
          placeholder="Source Expression (e.g. orders.amount)"
          value={newMapping}
          onChange={(e) => setNewMapping(e.target.value)}
          style={{ width: "300px" }}
        />
        <button onClick={addMapping}>Add Mapping</button>
      </div>

      {Object.entries(mappings).map(([factCol, expr]) => (
        <div key={factCol}>
          <b>{factCol}</b> → {expr}
        </div>
      ))}

      {/* Generate SQL */}
      <h3>Generate Merge SQL</h3>
      <button
        onClick={generateMerge}
        disabled={!factTable || sourceTables.length === 0 || Object.keys(mappings).length === 0}
      >
        Generate SQL
      </button>
      {sql && (
        <pre style={{ background: "#eee", padding: "10px" }}>{sql}</pre>
      )}
    </div>
  );
}
