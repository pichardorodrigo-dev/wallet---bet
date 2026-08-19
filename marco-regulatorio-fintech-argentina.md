# Marco legal/regulatorio para una billetera virtual y pasarela de pagos en Argentina

_Nota: esto es investigación general para orientar decisiones de producto/arquitectura, no asesoramiento legal formal. Validar con un estudio especializado en fintech antes de operar con dinero real. Última actualización: agosto 2026._

## 1. Reguladores involucrados

- **BCRA (Banco Central):** regula Proveedores de Servicios de Pago (PSP) y billeteras virtuales en pesos.
- **CNV (Comisión Nacional de Valores):** regula Proveedores de Servicios de Activos Virtuales (PSAV/cripto) y agentes de negociación de valores (acciones, bonos).
- **UIF (Unidad de Información Financiera):** obligaciones de prevención de lavado de activos y financiamiento del terrorismo (Ley 25.246).
- **Defensa del Consumidor** y **Ley de Protección de Datos Personales 25.326**: aplican en paralelo.

## 2. Caminos legales para operar una billetera

1. **Banco digital con licencia bancaria plena** (entidad financiera bajo la Ley de Entidades Financieras). Ejemplo confirmado: **Brubank**, autorizado por el BCRA a operar como banco 100% digital. Régimen más pesado, más libertad de producto (crédito, plazo fijo, etc.).
2. **PSP / PSPCP (Proveedor de Servicios de Pago que ofrece Cuentas de Pago)**, registrado ante el BCRA sin ser entidad financiera. Ejemplo confirmado: **Mercado Pago S.A.** (registrado como PSPCP, no es un banco). La mayoría de las billeteras de segunda línea (Ualá, Personal Pay, Naranja X, etc.) siguen este camino, generalmente apoyadas en una entidad financiera asociada para custodia/tarjetas — no se pudo confirmar con fuente firme el partner puntual de cada una.
   - Regla clave: los fondos de usuarios deben estar depositados en cuentas de entidades financieras reguladas o fondos money market; el PSP no puede prestarlos ni invertirlos libremente.

### Reforma reciente del régimen PSP (BCRA, 2026)
- Comunicación "A" 8432 (6 de mayo de 2026): nueva subcategoría "PSPCP como servicio" para plataformas que ofrecen la billetera a través de terceros.
- Exige: banco patrocinante identificado, estructura societaria completa declarada, oficial de cumplimiento ante la UIF.
- Excluye a la empresa si accionistas/directores figuran en listas de UIF, RePET o Consejo de Seguridad de la ONU.
- Plazo de adecuación: 90 días corridos (hasta 3/8/2026 para ya registrados). Plazo para que PSP nuevos empiecen a operar tras registrarse: 12 meses.
- BCRA puede dar de baja de oficio por inactividad (180+ días), sanciones o cambios operativos no reportados.

## 3. KYC/AML (UIF)

Un PSP es sujeto obligado bajo la Ley 25.246: debe identificar y verificar clientes (KYC), armar matriz de riesgo, designar oficial de cumplimiento, presentar Reportes de Operaciones Sospechosas (ROS) y conservar registros mínimo 10 años. Para 2026 la UIF exige además autoevaluación de riesgo y revisión externa independiente (Resolución UIF 37/2026).

## 4. Responsabilidad cuando se usa para movimientos ilícitos

Dos planos distintos:

**a) Frente al usuario (civil/consumidor)** — ej. estafas. La jurisprudencia aplica responsabilidad condicional, no automática:
- Si la operación se originó desde el dispositivo/IP habitual del usuario y no hay evidencia de brecha de seguridad del proveedor → tribunales han rechazado reclamos contra la billetera (caso Mercado Pago 2024).
- Si se prueba incumplimiento de los propios protocolos de seguridad (Comunicaciones BCRA A6878 y A7777 exigen autenticación y gestión de riesgo tecnológico) → surge responsabilidad.

**b) Regulatoria/penal por lavado de activos:**
- Sanciones administrativas de la UIF (multas) por controles AML deficientes.
- Baja del registro PSP por el BCRA.
- Responsabilidad penal (art. 303 Código Penal, lavado de activos) para personas físicas si se prueba conocimiento o complicidad — no por el solo hecho de que un usuario haya delinquido usando la plataforma sin que la empresa lo supiera o pudiera detectarlo con controles razonables.
- Antecedente judicial: caso "Bobinas Blancas" — procesamiento por lavado de activos a un intercambiador de bitcoin sin controles.

## 5. Vinculación con venta de USDT/cripto y bonos

**Cripto (USDT, etc.):** regulado por la CNV desde 2024 vía el **Registro PSAV** (Proveedor de Servicios de Activos Virtuales, Resolución General 994/2024). Cubre intercambio cripto-peso, intercambio entre criptoactivos, custodia y transferencia de activos virtuales. Es un registro y regulador **distinto** del PSP/BCRA — una billetera en pesos no lo necesita hasta que agrega funcionalidad cripto. Requisitos: políticas de seguridad informática, segregación de cuentas de clientes, patrimonio mínimo, procedimientos de delegación de funciones. Aplica también a proveedores extranjeros que dirigen publicidad a residentes argentinos (no aplica si es "reverse solicitation").

**Bonos / valores negociables:** quedan **excluidos** de la categoría "activo virtual" del régimen PSAV porque ya están regulados por la Ley de Mercado de Capitales (26.831). Para intermediar en bonos se necesita ser **Agente de Negociación** registrado en la CNV — un régimen de bróker/dealer con requisitos de capital mínimo y controles mucho más estrictos. No es algo que se pueda sumar como feature menor a una billetera; es un salto regulatorio mayor.

**Resumen del camino regulatorio según alcance de producto:**
- Billetera solo en pesos → BCRA / registro PSP.
- + Compra/venta/custodia de cripto (USDT, etc.) → + registro PSAV ante CNV.
- + Intermediación en bonos u otros valores negociables → + licencia de Agente de Negociación ante CNV (régimen mucho más pesado).

## Fuentes
- [Regulación fintech en Argentina — Estudio Lexar](https://estudiolexar.com/regulacion-fintech-en-argentina-el-marco-normativo-que-deben-conocer-las-empresas-del-ecosistema-de-pagos-y-servicios-financieros-digitales/)
- [El Banco Central introduce nuevas regulaciones sobre PSP — Allende & Brea](https://allende.com/fintech/el-banco-central-introduce-nuevas-regulaciones-sobre-proveedores-de-servicios-de-pago-05-14-2026/)
- [El BCRA refuerza la protección a los usuarios de billeteras virtuales — Infobae](https://www.infobae.com/economia/2026/04/30/el-bcra-refuerza-la-proteccion-a-los-usuarios-de-billeteras-virtuales-una-por-una-las-medidas-que-adopto/)
- [Registro de Proveedores de Servicios de Pago — BCRA](https://www.bcra.gob.ar/en/registering-in-the-payment-service-provider-registry/)
- [Normativa UIF 2026 actualizada — CyA Integral Consulting](https://consultingcya.com.ar/normativa-uif-2026-actualizada/)
- [Responsabilidad de las billeteras virtuales frente a una estafa — Microjuris](https://aldiaargentina.microjuris.com/2025/02/19/actualidad-tips-juridicos-responsabilidad-de-las-billeteras-virtuales-frente-a-una-estafa/)
- [Registro PSAV en Argentina — Estudio Lexar](https://estudiolexar.com/registro-psav-argentina/)
- [La CNV crea el Registro de Proveedores de Servicios de Activos Virtuales — Argentina.gob.ar](https://www.argentina.gob.ar/noticias/la-cnv-crea-el-registro-de-proveedores-de-servicios-de-activos-virtuales-psav)
- [Brubank: autorización del BCRA para operar como banco 100% digital — iProfesional](https://www.iprofesional.com/finanzas/261329-el-brubank-ya-tiene-la-autorizacion-del-bcra-para-operar-como-banco-100-digital)
- [Caso "Bobinas Blancas" — lavado de activos con monedas virtuales — Derecho Penal Online](https://derechopenalonline.com/caso-bobinas-blancas-lavado-de-activos-de-origen-ilegal-monedas-virtuales-intercambiador-de-bitcoins-procesamiento/)
