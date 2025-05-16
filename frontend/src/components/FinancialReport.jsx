import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  TextField, 
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="content-type" content="text/html; charset=utf-8">
  <title>Page not found at /api/auth/login/</title>
  <meta name="robots" content="NONE,NOARCHIVE">
  <style>
    html * { padding:0; margin:0; }
    body * { padding:10px 20px; }
    body * * { padding:0; }
    body { font-family: sans-serif; background:#eee; color:#000; }
    body > :where(header, main, footer) { border-bottom:1px solid #ddd; }
    h1 { font-weight:normal; margin-bottom:.4em; }
    h1 small { font-size:60%; color:#666; font-weight:normal; }
    table { border:none; border-collapse: collapse; width:100%; }
    td, th { vertical-align:top; padding:2px 3px; }
    th { width:12em; text-align:right; color:#666; padding-right:.5em; }
    #info { background:#f6f6f6; }
    #info ol { margin: 0.5em 4em; }
    #info ol li { font-family: monospace; }
    #summary { background: #ffc; }
    #explanation { background:#eee; border-bottom: 0px none; }
    pre.exception_value { font-family: sans-serif; color: #575757; font-size: 1.5em; margin: 10px 0 10px 0; }
  </style>
</head>
<body>
  <header id="summary">
    <h1>Page not found <small>(404)</small></h1>
    
    <table class="meta">
      <tr>
        <th scope="row">Request Method:</th>
        <td>POST</td>
      </tr>
      <tr>
        <th scope="row">Request URL:</th>
        <td>http://localhost:8000/api/auth/login/</td>
      </tr>
      
    </table>
  </header>

  <main id="info">
    
      <p>
      Using the URLconf defined in <code>logistic_crm.urls</code>,
      Django tried these URL patterns, in this order:
      </p>
      <ol>
        
          <li>
            
              <code>
                admin/
                
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                csrf/
                [name='csrf-token']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                login/
                [name='login']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                validate-token/
                [name='validate-token']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^orders/$
                [name='order-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^orders\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='order-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^orders/export_orders_csv/$
                [name='order-export-orders-csv']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^orders/export_orders_csv\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='order-export-orders-csv']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^orders/(?P&lt;pk&gt;[^/.]+)/$
                [name='order-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^orders/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='order-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^clients/$
                [name='client-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^clients\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='client-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^clients/me/$
                [name='client-me']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^clients/me\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='client-me']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^clients/(?P&lt;pk&gt;[^/.]+)/$
                [name='client-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^clients/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='client-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^cargos/$
                [name='cargo-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^cargos\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='cargo-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^cargos/(?P&lt;pk&gt;[^/.]+)/$
                [name='cargo-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^cargos/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='cargo-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^vehicles/$
                [name='vehicle-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^vehicles\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='vehicle-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^vehicles/(?P&lt;pk&gt;[^/.]+)/$
                [name='vehicle-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^vehicles/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='vehicle-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^tasks/$
                [name='task-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^tasks\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='task-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^tasks/(?P&lt;pk&gt;[^/.]+)/$
                [name='task-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^tasks/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='task-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^documents/$
                [name='document-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^documents\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='document-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^documents/(?P&lt;pk&gt;[^/.]+)/$
                [name='document-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^documents/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='document-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^documents/(?P&lt;pk&gt;[^/.]+)/generate_contract/$
                [name='document-generate-contract']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^documents/(?P&lt;pk&gt;[^/.]+)/generate_contract\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='document-generate-contract']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^payments/$
                [name='payment-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^payments\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='payment-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^payments/(?P&lt;pk&gt;[^/.]+)/$
                [name='payment-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^payments/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='payment-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^invoices/$
                [name='invoice-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^invoices\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='invoice-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^invoices/(?P&lt;pk&gt;[^/.]+)/$
                [name='invoice-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^invoices/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='invoice-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^users/$
                [name='customuser-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^users\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='customuser-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^users/(?P&lt;pk&gt;[^/.]+)/$
                [name='customuser-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^users/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='customuser-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                
                [name='api-root']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                &lt;drf_format_suffix:format&gt;
                [name='api-root']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                api/schema/
                [name='schema']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                api/docs/
                [name='docs']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                financial-report/
                [name='financial-report']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^orders/$
                [name='order-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^orders\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='order-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^orders/export_orders_csv/$
                [name='order-export-orders-csv']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^orders/export_orders_csv\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='order-export-orders-csv']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^orders/(?P&lt;pk&gt;[^/.]+)/$
                [name='order-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^orders/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='order-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^clients/$
                [name='client-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^clients\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='client-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^clients/me/$
                [name='client-me']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^clients/me\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='client-me']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^clients/(?P&lt;pk&gt;[^/.]+)/$
                [name='client-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^clients/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='client-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^cargos/$
                [name='cargo-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^cargos\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='cargo-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^cargos/(?P&lt;pk&gt;[^/.]+)/$
                [name='cargo-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^cargos/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='cargo-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^vehicles/$
                [name='vehicle-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^vehicles\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='vehicle-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^vehicles/(?P&lt;pk&gt;[^/.]+)/$
                [name='vehicle-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^vehicles/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='vehicle-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^tasks/$
                [name='task-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^tasks\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='task-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^tasks/(?P&lt;pk&gt;[^/.]+)/$
                [name='task-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^tasks/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='task-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^documents/$
                [name='document-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^documents\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='document-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^documents/(?P&lt;pk&gt;[^/.]+)/$
                [name='document-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^documents/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='document-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^documents/(?P&lt;pk&gt;[^/.]+)/generate_contract/$
                [name='document-generate-contract']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^documents/(?P&lt;pk&gt;[^/.]+)/generate_contract\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='document-generate-contract']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^payments/$
                [name='payment-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^payments\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='payment-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^payments/(?P&lt;pk&gt;[^/.]+)/$
                [name='payment-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^payments/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='payment-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^invoices/$
                [name='invoice-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^invoices\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='invoice-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^invoices/(?P&lt;pk&gt;[^/.]+)/$
                [name='invoice-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^invoices/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='invoice-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^users/$
                [name='customuser-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^users\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='customuser-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^users/(?P&lt;pk&gt;[^/.]+)/$
                [name='customuser-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^users/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='customuser-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                
                [name='api-root']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                &lt;drf_format_suffix:format&gt;
                [name='api-root']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                orders/&lt;int:pk&gt;/generate-contract/
                
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                system/config/
                [name='system-config']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^orders/$
                [name='order-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^orders\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='order-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^orders/export_orders_csv/$
                [name='order-export-orders-csv']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^orders/export_orders_csv\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='order-export-orders-csv']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^orders/(?P&lt;pk&gt;[^/.]+)/$
                [name='order-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^orders/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='order-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^clients/$
                [name='client-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^clients\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='client-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^clients/me/$
                [name='client-me']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^clients/me\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='client-me']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^clients/(?P&lt;pk&gt;[^/.]+)/$
                [name='client-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^clients/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='client-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^cargos/$
                [name='cargo-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^cargos\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='cargo-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^cargos/(?P&lt;pk&gt;[^/.]+)/$
                [name='cargo-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^cargos/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='cargo-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^vehicles/$
                [name='vehicle-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^vehicles\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='vehicle-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^vehicles/(?P&lt;pk&gt;[^/.]+)/$
                [name='vehicle-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^vehicles/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='vehicle-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^tasks/$
                [name='task-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^tasks\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='task-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^tasks/(?P&lt;pk&gt;[^/.]+)/$
                [name='task-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^tasks/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='task-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^documents/$
                [name='document-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^documents\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='document-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^documents/(?P&lt;pk&gt;[^/.]+)/$
                [name='document-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^documents/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='document-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^documents/(?P&lt;pk&gt;[^/.]+)/generate_contract/$
                [name='document-generate-contract']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^documents/(?P&lt;pk&gt;[^/.]+)/generate_contract\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='document-generate-contract']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^payments/$
                [name='payment-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^payments\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='payment-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^payments/(?P&lt;pk&gt;[^/.]+)/$
                [name='payment-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^payments/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='payment-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^invoices/$
                [name='invoice-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^invoices\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='invoice-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^invoices/(?P&lt;pk&gt;[^/.]+)/$
                [name='invoice-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^invoices/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='invoice-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^users/$
                [name='customuser-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^users\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='customuser-list']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^users/(?P&lt;pk&gt;[^/.]+)/$
                [name='customuser-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                ^users/(?P&lt;pk&gt;[^/.]+)\.(?P&lt;format&gt;[a-z0-9]+)/?$
                [name='customuser-detail']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                
                [name='api-root']
              </code>
            
          </li>
        
          <li>
            
              <code>
                api/
                
              </code>
            
              <code>
                
                
              </code>
            
              <code>
                &lt;drf_format_suffix:format&gt;
                [name='api-root']
              </code>
            
          </li>
        
          <li>
            
              <code>
                
                
              </code>
            
          </li>
        
      </ol>
      <p>
        
          The current path, <code>api/auth/login/</code>,
        
        didn’t match any of these.
      </p>
    
  </main>

  <footer id="explanation">
    <p>
      You’re seeing this error because you have <code>DEBUG = True</code> in
      your Django settings file. Change that to <code>False</code>, and Django
      will display a standard 404 page.
    </p>
  </footer>
</body>
</html>

  TableHead,
  TableRow
} from '@mui/material';
import { financialApi } from '../api/api';

const FinancialReport = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setError('Пожалуйста, выберите даты');
      return;
    }

    if (!validateDate(startDate) || !validateDate(endDate)) {
      setError('Пожалуйста, введите корректные даты');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setError('Начальная дата не может быть позже конечной');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await financialApi.getReport({
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0]
      });
      setReportData(response.data);
    } catch (err) {
      setError('Ошибка при получении отчета');
      console.error('Ошибка:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Финансовый отчет
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Начальная дата"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                max: endDate || new Date().toISOString().split('T')[0]
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Конечная дата"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                min: startDate,
                max: new Date().toISOString().split('T')[0]
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              onClick={handleGenerateReport}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Загрузка...' : 'Сформировать отчет'}
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Paper>

      {reportData && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Итоги периода
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white' }}>
                <Typography variant="subtitle2">Общая выручка</Typography>
                <Typography variant="h6">{reportData.total_revenue} ₽</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'white' }}>
                <Typography variant="subtitle2">Оплаченные заказы</Typography>
                <Typography variant="h6">{reportData.paid_orders}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'white' }}>
                <Typography variant="subtitle2">Ожидающие оплаты</Typography>
                <Typography variant="h6">{reportData.pending_payments} ₽</Typography>
              </Paper>
            </Grid>
          </Grid>

          <TableContainer sx={{ mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Дата</TableCell>
                  <TableCell>Заказ</TableCell>
                  <TableCell>Клиент</TableCell>
                  <TableCell align="right">Сумма</TableCell>
                  <TableCell>Статус</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{new Date(order.date).toLocaleDateString('ru-RU')}</TableCell>
                    <TableCell>{order.contract_number}</TableCell>
                    <TableCell>{order.client_name}</TableCell>
                    <TableCell align="right">{order.amount} ₽</TableCell>
                    <TableCell>{order.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default FinancialReport; 