import React from "react";
import Papa from "papaparse";

const CSVReader = ({ setInputData }) => {
  return (
    <div>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;

          const reader = new FileReader();

          reader.onload = (e) => {
            const text = e.target.result;

            Papa.parse(text, {
              header: true,
              skipEmptyLines: true,
              complete: (result) => {
                const parsedData = result.data;

                // Convert to lowercase
                const lowerCaseData = parsedData.map((row) =>
                  Object.fromEntries(
                    Object.entries(row).map(([key, value]) => [
                      // Add underscores where there are blank space
                      key.toLowerCase().replace(/\s+/g, "_"),
                      value,
                    ])
                  )
                );

                setInputData(lowerCaseData);
              },
            });
          };

          reader.readAsText(file);
        }}
      />
    </div>
  );
};

export default CSVReader;
