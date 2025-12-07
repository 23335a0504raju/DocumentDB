import { Search } from '@mui/icons-material';
import QueryHistory from '../components/QueryHistory';
import SearchChat from '../components/SearchChat';
import './SearchPage.css';

function SearchPage() {
  return (
    <div className="search-page">
      <div className="search-page-header">
        <div className="header-content">
          <Search className="header-icon" />
          <div>
            <h1>AI Document Search</h1>
            <p>Ask questions about your documents and get AI-powered answers with references</p>
          </div>
        </div>
      </div>

      <div className="search-page-content">
        <div className="search-main">
          <SearchChat />
        </div>
        <div className="search-sidebar">
          <QueryHistory compact={true} />
        </div>
      </div>
    </div>
  );
}

export default SearchPage;