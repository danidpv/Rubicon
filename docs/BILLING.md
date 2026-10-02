# Facturación

MockBillingProvider cambia permisos en PostgreSQL sin cobros. StripeBillingProvider crea Customer y Checkout y utiliza Customer Portal para gestionar suscripciones existentes (cambios y cancelación).

Configurar BILLING_PROVIDER=stripe, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET y STRIPE_PRICE_MAP como objeto JSON Plan.code → price_.... Los precios mostrados se guardan en Plan y no sustituyen los precios de Stripe. Activar los productos permitidos en la configuración del portal de Stripe.

Webhook /api/v1/billing/webhook usa raw body y firma. BillingEvent.providerEventId UNIQUE y cambios en una sola transacción; los duplicados confirmados no reaplican efectos. Eventos antiguos no sustituyen estados más recientes. customer.subscription.created/updated/deleted actualizan permisos y vigencia; invoice.payment_failed retira acceso activo. Nunca se concede acceso por la URL de retorno.

Validación local con mock. Antes de producción ejecutar pruebas Stripe test de creación, renovación, pago fallido, cancelación, cambios y reenvíos. Referencia oficial: https://github.com/stripe/stripe-node/tree/master/examples/webhook-signing.
