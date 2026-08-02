// Copy transcribed verbatim from reference/pages/en/index.md (https://www.dietz.eu/en/).
// Do not paraphrase; this is the live site's approved English wording. The hero
// lede keeps the source's first sentence intact and simply drops its trailing
// "We work for the following industries, among others:" clause, which now
// lives as `hero.industriesIntro` for the IndustryStrip section below it.
import type { HomepageEntry } from "@/content/schema";

export const homepageEn: HomepageEntry = {
  id: "homepage",
  locale: "en",
  slug: "",
  seo: {
    title: "Dietz GmbH | Springs, bent parts and components made in Germany",
    description:
      "One of the leading manufacturers of hybrid assemblies, precision springs and stamped-formed parts in Germany. IATF 16949 certified, family-run since 1928.",
  },
  type: "homepage",

  hero: {
    kicker: "Since 1928 · Neustadt bei Coburg",
    title: "Dietz GmbH – Springs, bent parts and components made in Germany",
    intro:
      "We are one of the leading manufacturers of hybrid assemblies, precision springs and stamped-formed parts in Germany.",
    industries: [
      "Automotive",
      "Electrical engineering",
      "Medical technology",
      "White goods"
    ],
    industriesIntro: "We work for the following industries, among others.",
  },

  products: {
    title: "Products",
    exploreLabel: "Explore",
    items: [
      {
        title: "Hybrid Assemblies",
        href: "/en/products/hybrid-assemblies/",
        body: "Dietz GmbH specializes in the development support and production of hybrid assemblies. By combining different materials and manufacturing techniques, we can offer flexible solutions for demanding applications. Whether electronic components in plastic housings, metal parts with integrated plastic elements or other individual requirements – we will find the right solution for your project. Benefit from our know-how in hybrid assembly production and rely on quality and reliability.",
      },
      {
        title: "Stamped and formed parts",
        href: "/en/products/stamped-and-formed-parts/",
        body: "Dietz GmbH is your partner for stamping and forming technology. With state-of-the-art machinery and an experienced team, we can produce complex sheet metal parts according to your individual requirements. Whether prototypes or series production – we offer you the highest precision and quality. Our wide range of services includes punching, bending, forming and other processes. Rely on our expertise in stamping and forming technology and benefit from cost-efficient solutions and short delivery times.",
      },
      {
        title: "Precision springs",
        href: "/en/products/precision-springs/",
        body: "Dietz GmbH is your competent partner for spring technology. We produce high-precision and reliable springs for a wide range of applications. Whether compression springs, tension springs, torsion springs or torsion springs – we manufacture according to individual customer requirements and offer you tailor-made solutions. Our experienced staff and state-of-the-art production facilities ensure the highest quality and fast delivery. Rely on our many years of experience in spring technology and benefit from efficient and cost-effective solutions.",
      },
      {
        title: "Bent wire parts",
        href: "/en/products/bent-wire-parts/",
        body: "Dietz GmbH is your reliable partner in the production of bent wire parts. With our state-of-the-art manufacturing technology, we are able to offer tailor-made solutions for your individual requirements. Our experienced team of professionals guarantees the highest precision and quality at every step of the manufacturing process. Whether it's a small or large quantity, we deliver on time and at competitive prices. Trust in our many years of expertise and let us turn your ideas into reality together.",
      },
      {
        title: "Sample and prototype construction",
        href: "/en/products/prototype-and-sample-construction/",
        body: "Innovation and quality are the top priorities at Dietz GmbH in the field of sample and prototype construction. Our highly skilled team will work closely with you to understand your requirements and turn your vision into reality. We offer you the fastest possible delivery times and excellent results to ensure that you achieve your development goals. Trust in our many years of experience and technical expertise – we look forward to working with you!",
      },
      {
        title: "Plastics Technology",
        href: "/en/products/plastics-technology/",
        body: "Our plastics are versatile materials with a wide range of properties that can be customized as needed. With our state-of-the-art machinery, we provide reliable production. This technology makes it possible to produce products in different sizes, shapes and designs with excellent precision and quality.",
      },
      {
        title: "Special packaging",
        href: "/en/products/special-packaging/",
        body: "Dietz GmbH is your competent partner for the development and production of special packaging. We offer tailor-made solutions for various industries and applications. Whether it's transport packaging, sales packaging or special requirements – we work with you to develop the optimal solution for your products. Our packaging impresses with its quality, functionality and attractive design. You can rely on our experience and our high degree of flexibility to package your products safely and attractively.",
      }
    ],
  },

  services: {
    title: "Services",
    moreLabel: "More on",
    items: [
      {
        title: "Production",
        href: "/en/enterprise/performances/production/",
        thumb: "/images/teasers/t-produktion.jpg",
        body: "From mechanical components to electronic components, we offer tailor-made solutions for each customer. We use state-of-the-art technologies and production processes to ensure the highest quality standards.",
      },
      {
        title: "Material",
        href: "/en/enterprise/performances/material/",
        thumb: null,
        body: "Our material selection is based on strict criteria and many years of experience as well as thorough market analysis. We work closely with reputable suppliers who provide us with a wide range of high-quality materials from all over the world.",
      },
      {
        title: "Quality",
        href: "/en/enterprise/performances/quality/",
        thumb: "/images/teasers/t-qualitaet.jpg",
        body: "We are IATF 16949 certified and meet the highest quality standards. Our company relies on automation, process optimisation and continuous improvement to ensure that our customers always receive the best possible quality.",
      },
      {
        title: "Logistics",
        href: "/en/enterprise/performances/logistics/",
        thumb: "/images/teasers/t-logistik.jpg",
        body: "With comprehensive know-how, Dietz GmbH optimizes the processes in the supply chain to ensure efficient and smooth logistics.",
      }
    ],
  },

  sustainability: {
    title: "Sustainability",
    subtitle: "Resource Conservation, Environmental Projects, Guidelines",
    href: "/en/enterprise/sustainability/",
    body: "Our thinking about the environment starts with product development. By using state-of-the-art technologies and environmentally friendly materials, we ensure that our products meet the highest ecological standards. We make sure that all materials used are recyclable and that no harmful emissions are produced during production.",
    linkLabel: "Our sustainability commitments",
  },

  company: {
    title: "The Company",
    subtitle: "Innovation, Quality, History",
    href: "/en/enterprise/",
    body: "Founded in 1928 in Neustadt near Coburg, Dietz GmbH is one of the leading manufacturers of technical precision springs, hybrid assemblies and bent wire parts. As a medium-sized, owner-managed company with 160 employees, Dietz supplies well-known and international customers from a wide range of industries.",
    stats: [
      { value: "1928", label: "Founded in Neustadt near Coburg" },
      { value: "160", label: "Employees" },
      { value: "IATF 16949", label: "Certified quality management" }
    ],
    linkLabel: "About Dietz GmbH",
  },

  // No `news`/`events` — confirmed DE-only sections on the live site.

  certifications: {
    heading: "Certified to the standards our customers are audited against.",
    intro:
      "Quality, environmental and customs certifications held by Dietz GmbH. Certificates are available in full from the downloads area.",
    items: [
      {
        src: "/images/certs/dekra-iso-9001.webp",
        name: "ISO 9001",
        note: "Quality management system, certified by DEKRA",
      },
      {
        src: "/images/certs/dekra-iatf-16949.webp",
        name: "IATF 16949",
        note: "Automotive quality management, certified by DEKRA",
      },
      {
        src: "/images/certs/ISO-14001-2015.webp",
        name: "ISO 14001:2015",
        note: "Environmental management system",
      },
      {
        src: "/images/certs/emas_logo_2020-07-16-Dietz.webp",
        name: "EMAS",
        note: "EU Eco-Management and Audit Scheme",
      },
      {
        src: "/images/certs/logo-umweltpakt2015-rgb.webp",
        name: "Umweltpakt Bayern",
        note: "Environmental pact with the Free State of Bavaria",
      },
      {
        src: "/images/certs/Logo-Klimaneutrales-Bayern-2040.webp",
        name: "Klimaneutrales Bayern 2040",
        note: "Bavarian climate-neutrality initiative",
      },
      {
        src: "/images/certs/medal.webp",
        name: "EcoVadis",
        note: "Bronze medal for sustainability performance",
      },
      {
        src: "/images/certs/aeo.webp",
        name: "AEO",
        note: "Authorised Economic Operator customs status",
      }
    ],
    downloadsHref: "/en/downloads/",
    downloadsLabel: "Download certificates",
  },

  cta: {
    heading: "Let's build your part.",
    body: "Tell us what you need: springs, bent parts, stampings or a full hybrid assembly. We'll come back to you with a route to production.",
    button: {
      kind: "typeform",
      typeformId: "01HHYPGYGQFR0BRFHV2WWR2ZEF",
      label: "Contact us now",
    },
  },
};
