import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PaymentElement } from "@stripe/react-stripe-js";
import { useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: "https://example.com/thanks", // ⬅️ oder localhost:3000/success etc.
      },
    });

    if (error) {
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 30 }}>
      <PaymentElement />
      <button type="submit" disabled={!stripe} style={{ marginTop: 20 }}>
        Zahlung bestätigen
      </button>
    </form>
  );
}

function CheckoutPage({ clientSecret }) {
  const options = {
    clientSecret,
    appearance: {
      theme: "stripe",
    },
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h3>💳 Jetzt bezahlen</h3>
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm />
      </Elements>
    </div>
  );
}

export default CheckoutPage;
