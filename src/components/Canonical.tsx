import React from "react";
import { Helmet } from "react-helmet-async";

type OgProps = {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: string;
};

type Props = {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  og?: OgProps;
};

const Canonical: React.FC<Props> = ({ title, description, canonical, noindex, og }) => {
  return (
    <Helmet>
      {title ? <title>{title}</title> : null}
      {description ? <meta name="description" content={description} /> : null}
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      {noindex ? <meta name="robots" content="noindex, follow" /> : null}

      {og?.title ? <meta property="og:title" content={og.title} /> : null}
      {og?.description ? <meta property="og:description" content={og.description} /> : null}
      {og?.url ? <meta property="og:url" content={og.url} /> : null}
      {og?.image ? <meta property="og:image" content={og.image} /> : null}
      {og?.type ? <meta property="og:type" content={og.type} /> : null}
    </Helmet>
  );
};

export default Canonical;
