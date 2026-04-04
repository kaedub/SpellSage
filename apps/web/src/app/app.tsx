import { Route, Routes } from 'react-router-dom';
import { Layout } from './layout';
import { HomePage } from './pages/home';
import { SearchPage } from './pages/search';
import { CollectionPage } from './pages/collection';
import { TagsPage } from './pages/tags';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="collection" element={<CollectionPage />} />
        <Route path="tags" element={<TagsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
