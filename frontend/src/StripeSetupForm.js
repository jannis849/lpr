import React, { useState, useEffect } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import api from "./api";

function StripeSetupForm({ onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.post("/payment/setup-intent");
        setClientSecret(res.data.client_secret);
      } catch (err) {
        console.error(err);
        setMessage("❌ Fehler beim Erstellen des SetupIntents.");
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const result = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: "http://localhost:3000" // nicht benutzt, aber nötig
      },
      redirect: "if_required"
    });

    if (result.error) {
      setMessage(result.error.message);
    } else {
      const paymentMethod = result.setupIntent.payment_method;
      await api.post("/payment/method-complete", { payment_method_id: paymentMethod });
      setMessage("✅ Zahlungsmethode gespeichert.");
      onSuccess();
    }
  };

  return (
    <div className="mt-6 bg-neutral-700 p-4 rounded-md">
      <h3 className="text-lg font-medium mb-2">Zahlungsmethode hinterlegen</h3>
      {clientSecret && (
        <form onSubmit={handleSubmit}>
          <PaymentElement />
          <button
            disabled={!stripe}
            className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded"
          >
            Speichern
          </button>
        </form>
      )}
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
}

export default StripeSetupForm;
