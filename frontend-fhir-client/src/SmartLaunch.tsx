import React, { useEffect, useState } from "react";
import FHIR from "fhirclient";

const clientId = "77d08b9e-769c-4ad7-8f2a-7d90aa3b7d46";
const scope = "launch openid fhirUser patient/*.read";
const redirectUri = window.location.origin + "/smart-callback";

export default function SmartLaunch() {
  const [patient, setPatient] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const iss = params.get("iss");
    const launch = params.get("launch");

    if (iss && launch) {
      FHIR.oauth2.authorize({
        clientId,
        scope,
        redirectUri,
        iss,
        launch,
      });
    } else {
      FHIR.oauth2
        .ready()
        .then((client: any) => {
          client.patient.read().then(setPatient);
        })
        .catch((e: any) => setError(e.message));
    }
  }, []);

  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (patient) return <pre>{JSON.stringify(patient, null, 2)}</pre>;
  return <div>Loading SMART on FHIR...</div>;
} 