export default function PublicLoading() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <div className="route-loading-inner">
        <p className="text-meta mb-3">Loading ABHIDEA</p>
        <div className="route-loading-bar" aria-hidden="true" />
        <span className="visually-hidden">Loading page</span>
      </div>
    </div>
  );
}
