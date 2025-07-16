from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from flask_cors import CORS
import traceback
from datetime import datetime

# --- Prophet Forecast Section ---
from prophet import Prophet

app = Flask(__name__)
CORS(app)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        file = request.files['file']
        df = pd.read_csv(file)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')

        # Feature engineering
        df['hour'] = df['timestamp'].dt.hour
        df['day'] = df['timestamp'].dt.day
        df['month'] = df['timestamp'].dt.month

        # One-hot encode categorical features
        df_encoded = pd.get_dummies(df, columns=['phase', 'product_category', 'day_of_week', 'zone_id'], drop_first=True)

        # Define target and features
        X = df_encoded.drop(columns=['timestamp', 'footfall'])
        if 'zone_temp' not in X.columns:
            X['zone_temp'] = df['zone_temp']
        if 'sales_volume' not in X.columns:
            X['sales_volume'] = df['sales_volume']
        y = df_encoded['footfall']

        # Train-test split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Train the model
        model = RandomForestRegressor(n_estimators=100, max_depth=10, min_samples_split=5, random_state=42)
        model.fit(X_train, y_train)

        # Make predictions
        y_pred = model.predict(X_test)

        # Evaluate
        rmse = mean_squared_error(y_test, y_pred) ** 0.5
        r2 = r2_score(y_test, y_pred)

        # Add predictions to a copy of the test set
        X_test_copy = X_test.copy()
        X_test_copy['predicted_footfall'] = y_pred

        # Reconstruct original categorical columns
        zone_columns = [col for col in X_test_copy.columns if col.startswith('zone_id_')]
        X_test_copy['zone'] = X_test_copy[zone_columns].idxmax(axis=1).str.replace('zone_id_', '')
        phase_columns = [col for col in X_test_copy.columns if col.startswith('phase_')]
        X_test_copy['phase'] = X_test_copy[phase_columns].idxmax(axis=1).str.replace('phase_', '')
        product_columns = [col for col in X_test_copy.columns if col.startswith('product_category_')]
        X_test_copy['product_category'] = X_test_copy[product_columns].idxmax(axis=1).str.replace('product_category_', '')

        # Aggregate average predicted footfall per zone
        zone_summary = X_test_copy.groupby('zone')['predicted_footfall'].mean().reset_index()

        # Simulate heat zones
        threshold_heat = 60
        X_test_copy['is_heat_zone'] = X_test_copy['predicted_footfall'] > threshold_heat
        heat_zone_summary = X_test_copy.groupby('zone')['is_heat_zone'].mean().reset_index()
        heat_zone_summary['heat_zone_probability'] = heat_zone_summary['is_heat_zone']
        heat_zone_summary = heat_zone_summary.drop(columns=['is_heat_zone'])

        # Identify high-traffic times for Zone Z4
        z4_data = df[df['zone_id'] == 'Z4'].copy()
        z4_data['hour'] = z4_data['timestamp'].dt.hour
        high_traffic_times = z4_data[z4_data['footfall'] > z4_data['footfall'].mean()]['hour'].value_counts().head(3).index.tolist()

        # Simulate cooling adjustment
        base_cooling_energy = 50
        cooling_factor = 1.5
        X_test_copy['cooling_energy'] = base_cooling_energy + (X_test_copy['is_heat_zone'].astype(int) * cooling_factor)
        cooling_summary = X_test_copy.groupby('zone')['cooling_energy'].mean().reset_index()

        # Merge summaries for suggestions
        suggested_changes = zone_summary.merge(heat_zone_summary, on='zone').merge(cooling_summary, on='zone')
        suggested_changes = suggested_changes[suggested_changes['heat_zone_probability'] > 0.5]

        # Rearrangement logic (proximity penalty)
        refrigeration_zones = ['Z1', 'Z2']
        df['is_refrigeration'] = df['zone_id'].isin(refrigeration_zones).astype(int)
        df['proximity_penalty'] = df.apply(
            lambda row: row['footfall'] * 2 if row['is_refrigeration'] == 1 and row['footfall'] > 60 else 0,
            axis=1
        )
        zone_traffic = df.groupby('zone_id')['footfall'].mean().reset_index()
        zone_traffic.columns = ['zone', 'traffic_score']
        total_penalty = df.groupby('zone_id')['proximity_penalty'].sum().reset_index()
        total_penalty = total_penalty.rename(columns={'zone_id': 'zone'})
        zone_traffic = zone_traffic.merge(total_penalty, on='zone', how='left').fillna(0)

        # Simulated validation - use actual footfall instead of predicted_footfall
        base_cooling = 50
        energy_factor = 0.1
        simulated_energy = base_cooling + (zone_traffic['traffic_score'] * energy_factor)

        # Suggest rearrangements
        traffic_impact_factor = 0.2
        max_safe_traffic = 70
        max_capacity = 80
        suggested_arrangements = []
        for _, row in zone_traffic[zone_traffic['proximity_penalty'] > 0].iterrows():
            current_zone = row['zone']
            current_traffic = row['traffic_score']
            current_penalty = row['proximity_penalty']
            available_zones = zone_traffic[~zone_traffic['zone'].isin(refrigeration_zones + [current_zone])]
            if not available_zones.empty:
                target_zone = available_zones.loc[available_zones['traffic_score'].idxmin()]['zone']
                target_traffic = available_zones.loc[available_zones['traffic_score'].idxmin()]['traffic_score']
                traffic_impact = current_traffic * traffic_impact_factor
                new_target_traffic = target_traffic + traffic_impact
                common_product = df[df['zone_id'] == current_zone]['product_category'].mode()[0]
                if new_target_traffic <= max_capacity:
                    if new_target_traffic <= max_safe_traffic:
                        suggestion = {
                            'from_zone': current_zone,
                            'to_zone': target_zone,
                            'current_traffic': current_traffic,
                            'target_traffic': target_traffic,
                            'new_target_traffic': new_target_traffic,
                            'penalty': current_penalty,
                            'product': common_product,
                            'type': 'safe'
                        }
                    else:
                        suggestion = {
                            'from_zone': current_zone,
                            'to_zone': target_zone,
                            'current_traffic': current_traffic,
                            'target_traffic': target_traffic,
                            'new_target_traffic': new_target_traffic,
                            'penalty': current_penalty,
                            'product': common_product,
                            'type': 'warning'
                        }
                else:
                    suggestion = {
                        'from_zone': current_zone,
                        'to_zone': target_zone,
                        'current_traffic': current_traffic,
                        'target_traffic': target_traffic,
                        'new_target_traffic': new_target_traffic,
                        'penalty': current_penalty,
                        'product': common_product,
                        'type': 'exceeds_capacity'
                    }
                suggested_arrangements.append(suggestion)

        # Detailed suggestions for Zone Z4
        layout_suggestions = []
        if not suggested_changes.empty:
            for _, row in suggested_changes.iterrows():
                if row['zone'] == 'Z4':
                    z4_products = df[df['zone_id'] == 'Z4']['product_category'].value_counts()
                    shiftable_products = [prod for prod in z4_products.index if prod not in ['Dairy', 'Frozen']]
                    avg_temp_z4 = df[df['zone_id'] == 'Z4']['zone_temp'].mean()
                    layout_suggestions.append({
                        'zone': row['zone'],
                        'predicted_footfall': row['predicted_footfall'],
                        'heat_zone_probability': row['heat_zone_probability'],
                        'cooling_energy': row['cooling_energy'],
                        'high_traffic_times': high_traffic_times,
                        'shiftable_products': shiftable_products,
                        'cooling_cycle': {
                            'start_hour': min(high_traffic_times) if high_traffic_times else None,
                            'end_hour': (max(high_traffic_times) + 1) if high_traffic_times else None,
                            'temp_threshold': avg_temp_z4,
                            'increase': cooling_factor,
                            'base': base_cooling_energy
                        }
                    })
        else:
            layout_suggestions = [{'message': 'No zones currently identified as high heat zones. Layout appears efficient.'}]

        # Prepare data for Prophet - fix the groupby issue
        df_prophet = df[['timestamp', 'footfall']].copy()
        df_prophet = df_prophet.rename(columns={'timestamp': 'ds', 'footfall': 'y'})
        # Group by hour and sum only the numeric column, not datetime
        df_prophet['ds'] = df_prophet['ds'].dt.floor('h')
        df_prophet = df_prophet.groupby('ds')['y'].sum().reset_index()

        # Train Prophet model
        model = Prophet(yearly_seasonality=True, daily_seasonality=True)
        model.fit(df_prophet)

        # Forecast next 7 days (168 hours)
        future = model.make_future_dataframe(periods=168, freq='H')
        forecast = model.predict(future)

        # Prepare forecast data for frontend (last 7 days)
        forecast_json = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(168).copy()
        forecast_json['ds'] = forecast_json['ds'].astype(str)  # Convert datetime to string for JSON
        prophet_forecast = forecast_json.to_dict(orient='records')

        # --- Sample Walmart-style blueprint mapping ---
        sample_blueprint_layout = {
            "Dairy":            {"x": 20,  "y": 40,  "width": 80,  "height": 40,  "color": "green",  "isRefrigeration": True},
            "Meat":             {"x": 20,  "y": 90,  "width": 80,  "height": 40,  "color": "green",  "isRefrigeration": True},
            "Produce":          {"x": 20,  "y": 140, "width": 80,  "height": 40,  "color": "green"},
            "Bakery":           {"x": 20,  "y": 190, "width": 80,  "height": 40,  "color": "green"},
            "Grocery":          {"x": 110, "y": 40,  "width": 80,  "height": 190, "color": "green"},
            "Electronics":      {"x": 200, "y": 40,  "width": 100, "height": 60,  "color": "blue"},
            "Shoes":            {"x": 310, "y": 40,  "width": 80,  "height": 60,  "color": "blue"},
            "Pharmacy":         {"x": 110, "y": 240, "width": 80,  "height": 40,  "color": "blue"},
            "Health & Beauty":  {"x": 200, "y": 240, "width": 80,  "height": 40,  "color": "blue"},
            "Customer Service": {"x": 290, "y": 240, "width": 80,  "height": 40,  "color": "yellow"},
            "Checkouts":        {"x": 20,  "y": 290, "width": 350, "height": 30,  "color": "gray"},
        }
        # --- Generate blueprint_layout using sample mapping ---
        unique_zones = df['zone_id'].unique()
        zone_categories = df.groupby('zone_id')['product_category'].agg(lambda x: x.mode()[0] if not x.mode().empty else '').to_dict()
        grid_cols = 4
        grid_spacing_x = 150
        grid_spacing_y = 120
        default_width = 120
        default_height = 80
        blueprint_layout = {}
        for idx, zone_id in enumerate(sorted(unique_zones)):
            # Try to use product_category as the mapping key
            product_cat = zone_categories.get(zone_id, '').title()
            mapping = sample_blueprint_layout.get(product_cat)
            if mapping:
                layout = dict(mapping)
                layout['zone_id'] = zone_id
                layout['product_category'] = product_cat
            else:
                # Fallback to grid
                row = idx // grid_cols
                col = idx % grid_cols
                x = 50 + col * grid_spacing_x
                y = 100 + row * grid_spacing_y
                layout = {
                    'zone_id': zone_id,
                    'x': x,
                    'y': y,
                    'width': default_width,
                    'height': default_height,
                    'isRefrigeration': False,
                    'product_category': product_cat,
                    'color': 'gray'
                }
            blueprint_layout[zone_id] = layout

        # --- Generate suggested layout and moves based on rearrangement suggestions ---
        suggested_layout = blueprint_layout.copy()
        moves = []
        # Only process if there are rearrangement suggestions
        if suggested_arrangements:
            # Make a mutable copy
            suggested_layout = {k: dict(v) for k, v in blueprint_layout.items()}
            # For each suggestion, move the 'from_zone' to the position of 'to_zone'
            for suggestion in suggested_arrangements:
                from_zone = suggestion['from_zone']
                to_zone = suggestion['to_zone']
                # Find the target zone's position
                if to_zone in blueprint_layout:
                    to_pos = (blueprint_layout[to_zone]['x'], blueprint_layout[to_zone]['y'])
                else:
                    # If not found, skip
                    continue
                from_pos = (blueprint_layout[from_zone]['x'], blueprint_layout[from_zone]['y'])
                # Move the from_zone to the to_zone's position
                suggested_layout[from_zone]['x'] = to_pos[0]
                suggested_layout[from_zone]['y'] = to_pos[1]
                moves.append({
                    'zone_id': from_zone,
                    'from_x': from_pos[0],
                    'from_y': from_pos[1],
                    'to_x': to_pos[0],
                    'to_y': to_pos[1]
                })

        # Prepare response
        result = {
            'timestamp': datetime.now().isoformat(),
            'rmse': rmse,
            'r2_score': r2,
            'zone_summary': zone_summary.to_dict('records'),
            'heat_zone_summary': heat_zone_summary.to_dict('records'),
            'cooling_summary': cooling_summary.to_dict('records'),
            'layout_suggestions': layout_suggestions,
            'rearrangement_suggestions': suggested_arrangements,
            'prophet_forecast': prophet_forecast,
            'blueprint_layout': blueprint_layout,
            'suggested_layout': suggested_layout,
            'layout_moves': moves
        }

        # Add zone-level forecast and simulated energy usage
        zone_traffic_json = zone_traffic.to_dict(orient='records')
        result['zone_traffic_forecast'] = zone_traffic_json
        result['simulated_energy_usage'] = float(simulated_energy.sum())

        # Cooling and layout suggestions (collect as list of dicts for frontend)
        detailed_suggestions = []
        base_temp = 22.0  # Define base temperature
        adjacency_zones = ['Z3', 'Z4']  # Define adjacency zones
        
        for zone in sorted(df['zone_id'].unique()):
            # Get traffic from zone_traffic DataFrame
            zone_traffic_row = zone_traffic[zone_traffic['zone'] == zone]
            if not zone_traffic_row.empty:
                traffic = zone_traffic_row['traffic_score'].iloc[0]
            else:
                traffic = 0
                
            is_refrigeration = zone in refrigeration_zones
            adjacency_factor = 50 if zone in adjacency_zones and traffic > 50 else 0
            penalty = traffic * 2 if is_refrigeration and traffic > 30 else adjacency_factor
            
            if is_refrigeration and traffic > 40:
                adj_temp = base_temp - 2
                suggestion = f"Increase cooling: Adjust temperature from {base_temp:.1f}°C to {adj_temp:.1f}°C."
            elif is_refrigeration and traffic > 30:
                suggestion = "Monitor cooling; consider adjustment if footfall exceeds 40."
            elif traffic > 50 and not is_refrigeration and zone in adjacency_zones:
                available_zones = [z for z in df['zone_id'].unique() if z not in refrigeration_zones + [zone]]
                if available_zones:
                    # Find target zone with minimum traffic
                    target_zone = None
                    min_traffic = float('inf')
                    for z in available_zones:
                        z_traffic_row = zone_traffic[zone_traffic['zone'] == z]
                        if not z_traffic_row.empty:
                            z_traffic = z_traffic_row['traffic_score'].iloc[0]
                            if z_traffic < min_traffic:
                                min_traffic = z_traffic
                                target_zone = z
                    
                    if target_zone:
                        target_traffic = min_traffic
                        traffic_impact = traffic * traffic_impact_factor
                        new_target_traffic = target_traffic + traffic_impact
                        if new_target_traffic <= max_capacity:
                            if new_target_traffic <= max_safe_traffic:
                                suggestion = f"Suggest relocating high-traffic items to Zone {target_zone} (Current Traffic: {target_traffic:.2f}, New Traffic: {new_target_traffic:.2f}). Recommend redistributing items to balance traffic across zones."
                            else:
                                suggestion = f"Warning: Moving to Zone {target_zone} (Current Traffic: {target_traffic:.2f}, New Traffic: {new_target_traffic:.2f}) exceeds safe limit ({max_safe_traffic}) but within capacity ({max_capacity}). Consider partial move or redistribute items with monitoring."
                        else:
                            suggestion = f"No suitable zone found. New traffic ({new_target_traffic:.2f}) exceeds capacity ({max_capacity}). Suggest partial redistribution to balance traffic."
                    else:
                        suggestion = "No suitable target zone found."
                else:
                    suggestion = "No available zones for relocation."
            else:
                suggestion = "No adjustment needed."
                
            detailed_suggestions.append({
                "zone": zone,
                "predicted_footfall": float(traffic),
                "penalty": float(penalty),
                "suggestion": suggestion
            })
        result['detailed_zone_suggestions'] = detailed_suggestions

        return jsonify(result)
    except Exception as e:
        print('Error:', str(e))
        print('Traceback:', traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload-csv', methods=['POST'])
def upload_csv():
    return predict()

if __name__ == '__main__':
    app.run(debug=True, port=5000)