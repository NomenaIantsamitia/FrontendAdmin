import React, { useState } from 'react';
import NavbarAdmin from './taxi/NavbarAdmin';
import DashboardAdmin from './taxi/DashboardAdmin';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Statistiques from './taxi/Statistiques';
import ClientsAdmin from './taxi/CientsAdmin';
import ChauffeursAdmin from './taxi/ChauffeursAdmin';
function App() {
 return(
  <div>
    <BrowserRouter>
    <NavbarAdmin />
    <Routes>
      <Route element={<NavbarAdmin/>}/>
      <Route index element={<DashboardAdmin/>}/>
      <Route path='/admin/dashboard' element = {<DashboardAdmin />} />
      <Route path='/admin/statistics' element = {<Statistiques />} />
      <Route path='/admin/clients' element = {<ClientsAdmin />} />
      <Route path='/admin/chauffeurs' element = {<ChauffeursAdmin  />} />
    </Routes>
    </BrowserRouter>
  </div>
 )
}

export default App;