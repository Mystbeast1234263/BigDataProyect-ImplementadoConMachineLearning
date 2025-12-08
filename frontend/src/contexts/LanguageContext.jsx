import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    // Header
    'dashboard': 'GAMC Dashboard',
    'big_data_analytics': 'Big Data Analytics',
    'logout': 'Logout',
    'administrator': '👨‍💼 Administrator',
    'operator': '👨‍🔧 Operator',
    'viewer': '👁️ Viewer',
    
    // Dashboard
    'monitoring': 'Monitoring',
    'ml_predictions': 'ML Predictions',
    'health_alerts': 'Health & Alerts',
    'real_time_monitoring': 'Real-time monitoring, metrics & analytics',
    'sensor_dashboard': 'Sensor Dashboard',
    
    // KPICards
    'average': 'Average',
    'min': 'Min',
    'max': 'Max',
    'count': 'Count',
    'no_data_available': 'No data available',
    'no_chart_data_available': 'No chart data available',
    
    // Sidebar
    'sidebar_title': 'Dashboard',
    'controls_filters': 'Controls & Filters',
    'real_time_update': 'Real-time Update',
    'manual_update': 'Manual Update',
    'interval': 'Interval',
    'last_update': 'Last update',
    'smart_mode': 'Smart mode: Only loads when there is new data',
    'sensor_type': 'Sensor Type',
    'date_range_filter': 'Date Range Filter',
    'records_limit': 'Records Limit',
    'showing': 'Showing',
    'records_max': 'records max',
    'display_limit': 'Display Limit',
    'records': 'records',
    'limit_info': 'This limits the display of records. The date filter above will retrieve all matching records first.',
    'available_data': 'Available data',
    'start_date': 'Start Date',
    'end_date': 'End Date',
    'selected': 'Selected',
    'apply_filter': 'Apply Filter',
    'reset_range': 'Reset Range',
    'loading_date_ranges': 'Loading date ranges...',
    'no_data_available_for': 'No data available for',
    'no_date_range_found': 'No date range found. Try generating or uploading data first.',
    'please_select_dates': 'Please select both start and end dates',
    'invalid_date_range': 'Start date must be before or equal to end date',
    
    // Sensor Types
    'air_quality': 'Air Quality',
    'sound_level': 'Sound Level',
    'water_level': 'Water Level',
    'co2_temperature_humidity': 'CO2, Temperature, Humidity',
    'decibels': 'Decibels (dB)',
    'underground_level': 'Underground Level',
    
    // Action Buttons
    'refresh': 'Refresh',
    'generate': 'Generate',
    'clear': 'Clear',
    'generate_test_data': 'Generate Test Data',
    'select_records': 'Select number of records to generate. You\'ll review them before saving to the database.',
    'number_of_records': 'Number of Records',
    'slide_to_select': 'Slide to select 10-500 records',
    'specify_date_range': 'Specify date range',
    'start_date_label': 'Start Date',
    'end_date_label': 'End Date',
    'date_range_hint': 'If you don\'t specify dates, the last 30 days will be used',
    'generating': 'Generating...',
    'generate_preview': 'Generate & Preview',
    'cancel': 'Cancel',
    
    // File Upload
    'drag_csv_here': 'Drag a CSV file here or',
    'select_file': 'Select file',
    'csv_files_only': 'CSV files only (.csv)',
    'uploading_file': 'Uploading file...',
    'upload_csv_only': 'Please upload only CSV files',
    'select_csv_file': 'Please select a CSV file',
    'upload_error': 'Error uploading file. Please try again.',
    'records_imported': 'records imported successfully',
    'records_saved': 'records saved successfully',
    'delete_all_data': 'Delete all',
    'sensor_data_question': 'sensor data?',
    
    // Common
    'loading': 'Loading...',
    'error': 'Error',
    'success': 'Success',
    'on': 'ON',
    'off': 'OFF',
  },
  es: {
    // Header
    'dashboard': 'Panel GAMC',
    'big_data_analytics': 'Análisis de Big Data',
    'logout': 'Cerrar Sesión',
    'administrator': '👨‍💼 Administrador',
    'operator': '👨‍🔧 Operador',
    'viewer': '👁️ Visualizador',
    
    // Dashboard
    'monitoring': 'Monitoreo',
    'ml_predictions': 'Predicciones ML',
    'health_alerts': 'Salud y Alertas',
    'real_time_monitoring': 'Monitoreo en tiempo real, métricas y análisis',
    'sensor_dashboard': 'Panel de Sensores',
    
    // KPICards
    'average': 'Promedio',
    'min': 'Mín',
    'max': 'Máx',
    'count': 'Cantidad',
    'no_data_available': 'No hay datos disponibles',
    'no_chart_data_available': 'No hay datos de gráfica disponibles',
    
    // Sidebar
    'sidebar_title': 'Dashboard',
    'controls_filters': 'Controles y Filtros',
    'real_time_update': 'Actualización en Tiempo Real',
    'manual_update': 'Actualización Manual',
    'interval': 'Intervalo',
    'last_update': 'Última actualización',
    'smart_mode': 'Modo inteligente: Solo carga cuando hay datos nuevos',
    'sensor_type': 'Tipo de Sensor',
    'date_range_filter': 'Filtro de Rango de Fechas',
    'records_limit': 'Límite de Registros',
    'showing': 'Mostrando',
    'records_max': 'registros máximo',
    'display_limit': 'Límite de Visualización',
    'records': 'registros',
    'limit_info': 'Esto limita la visualización de registros. El filtro de fechas arriba recuperará todos los registros coincidentes primero.',
    'available_data': 'Datos disponibles',
    'start_date': 'Fecha Inicio',
    'end_date': 'Fecha Fin',
    'selected': 'Seleccionado',
    'apply_filter': 'Aplicar Filtro',
    'reset_range': 'Restablecer Rango',
    'loading_date_ranges': 'Cargando rangos de fechas...',
    'no_data_available_for': 'No hay datos disponibles para',
    'no_date_range_found': 'No se encontró rango de fechas. Intenta generar o subir datos primero.',
    'please_select_dates': 'Por favor selecciona fecha de inicio y fin',
    'invalid_date_range': 'La fecha de inicio debe ser anterior o igual a la fecha de fin',
    
    // Sensor Types
    'air_quality': 'Calidad del Aire',
    'sound_level': 'Nivel de Sonido',
    'water_level': 'Nivel de Agua',
    'co2_temperature_humidity': 'CO2, Temperatura, Humedad',
    'decibels': 'Decibelios (dB)',
    'underground_level': 'Nivel Subterráneo',
    
    // Action Buttons
    'refresh': 'Actualizar',
    'generate': 'Generar',
    'clear': 'Limpiar',
    'generate_test_data': 'Generar Datos de Prueba',
    'select_records': 'Selecciona el número de registros a generar. Los revisarás antes de guardarlos en la base de datos.',
    'number_of_records': 'Número de Registros',
    'slide_to_select': 'Desliza para seleccionar 10-500 registros',
    'specify_date_range': 'Especificar rango de fechas',
    'start_date_label': 'Fecha Inicio',
    'end_date_label': 'Fecha Fin',
    'date_range_hint': 'Si no especificas fechas, se usarán los últimos 30 días',
    'generating': 'Generando...',
    'generate_preview': 'Generar y Previsualizar',
    'cancel': 'Cancelar',
    
    // File Upload
    'drag_csv_here': 'Arrastra un archivo CSV aquí o',
    'select_file': 'Seleccionar archivo',
    'csv_files_only': 'Solo archivos CSV (.csv)',
    'uploading_file': 'Subiendo archivo...',
    'upload_csv_only': 'Por favor, sube solo archivos CSV',
    'select_csv_file': 'Por favor, selecciona un archivo CSV',
    'upload_error': 'Error al subir el archivo. Intenta nuevamente.',
    'records_imported': 'registros importados exitosamente',
    'records_saved': 'registros guardados exitosamente',
    'delete_all_data': 'Eliminar todos los',
    'sensor_data_question': 'datos del sensor?',
    
    // Common
    'loading': 'Cargando...',
    'error': 'Error',
    'success': 'Éxito',
    'on': 'ON',
    'off': 'OFF',
  },
  fr: {
    // Header
    'dashboard': 'Tableau de bord GAMC',
    'big_data_analytics': 'Analyse de Big Data',
    'logout': 'Déconnexion',
    'administrator': '👨‍💼 Administrateur',
    'operator': '👨‍🔧 Opérateur',
    'viewer': '👁️ Visualiseur',
    
    // Dashboard
    'monitoring': 'Surveillance',
    'ml_predictions': 'Prédictions ML',
    'health_alerts': 'Santé et Alertes',
    'real_time_monitoring': 'Surveillance en temps réel, métriques et analyses',
    'sensor_dashboard': 'Tableau de bord des capteurs',
    
    // KPICards
    'average': 'Moyenne',
    'min': 'Min',
    'max': 'Max',
    'count': 'Nombre',
    'no_data_available': 'Aucune donnée disponible',
    'no_chart_data_available': 'Aucune donnée de graphique disponible',
    
    // Sidebar
    'sidebar_title': 'Tableau de bord',
    'controls_filters': 'Contrôles et Filtres',
    'real_time_update': 'Mise à jour en temps réel',
    'manual_update': 'Mise à jour manuelle',
    'interval': 'Intervalle',
    'last_update': 'Dernière mise à jour',
    'smart_mode': 'Mode intelligent: Charge uniquement lorsqu\'il y a de nouvelles données',
    'sensor_type': 'Type de capteur',
    'date_range_filter': 'Filtre de plage de dates',
    'records_limit': 'Limite d\'enregistrements',
    'showing': 'Affichage',
    'records_max': 'enregistrements max',
    'display_limit': 'Limite d\'affichage',
    'records': 'enregistrements',
    'limit_info': 'Cela limite l\'affichage des enregistrements. Le filtre de dates ci-dessus récupérera d\'abord tous les enregistrements correspondants.',
    'available_data': 'Données disponibles',
    'start_date': 'Date de début',
    'end_date': 'Date de fin',
    'selected': 'Sélectionné',
    'apply_filter': 'Appliquer le filtre',
    'reset_range': 'Réinitialiser la plage',
    'loading_date_ranges': 'Chargement des plages de dates...',
    'no_data_available_for': 'Aucune donnée disponible pour',
    'no_date_range_found': 'Aucune plage de dates trouvée. Essayez de générer ou de télécharger des données d\'abord.',
    'please_select_dates': 'Veuillez sélectionner les dates de début et de fin',
    'invalid_date_range': 'La date de début doit être antérieure ou égale à la date de fin',
    
    // Sensor Types
    'air_quality': 'Qualité de l\'air',
    'sound_level': 'Niveau sonore',
    'water_level': 'Niveau d\'eau',
    'co2_temperature_humidity': 'CO2, Température, Humidité',
    'decibels': 'Décibels (dB)',
    'underground_level': 'Niveau souterrain',
    
    // Action Buttons
    'refresh': 'Actualiser',
    'generate': 'Générer',
    'clear': 'Effacer',
    'generate_test_data': 'Générer des données de test',
    'select_records': 'Sélectionnez le nombre d\'enregistrements à générer. Vous les examinerez avant de les enregistrer dans la base de données.',
    'number_of_records': 'Nombre d\'enregistrements',
    'slide_to_select': 'Glissez pour sélectionner 10-500 enregistrements',
    'specify_date_range': 'Spécifier la plage de dates',
    'start_date_label': 'Date de début',
    'end_date_label': 'Date de fin',
    'date_range_hint': 'Si vous ne spécifiez pas de dates, les 30 derniers jours seront utilisés',
    'generating': 'Génération...',
    'generate_preview': 'Générer et prévisualiser',
    'cancel': 'Annuler',
    
    // File Upload
    'drag_csv_here': 'Glissez un fichier CSV ici ou',
    'select_file': 'Sélectionner un fichier',
    'csv_files_only': 'Fichiers CSV uniquement (.csv)',
    'uploading_file': 'Téléchargement du fichier...',
    'upload_csv_only': 'Veuillez télécharger uniquement des fichiers CSV',
    'select_csv_file': 'Veuillez sélectionner un fichier CSV',
    'upload_error': 'Erreur lors du téléchargement du fichier. Veuillez réessayer.',
    'records_imported': 'enregistrements importés avec succès',
    'records_saved': 'enregistrements enregistrés avec succès',
    'delete_all_data': 'Supprimer toutes les',
    'sensor_data_question': 'données du capteur?',
    
    // Common
    'loading': 'Chargement...',
    'error': 'Erreur',
    'success': 'Succès',
    'on': 'ON',
    'off': 'OFF',
  },
  pt: {
    // Header
    'dashboard': 'Painel GAMC',
    'big_data_analytics': 'Análise de Big Data',
    'logout': 'Sair',
    'administrator': '👨‍💼 Administrador',
    'operator': '👨‍🔧 Operador',
    'viewer': '👁️ Visualizador',
    
    // Dashboard
    'monitoring': 'Monitoramento',
    'ml_predictions': 'Predições ML',
    'health_alerts': 'Saúde e Alertas',
    'real_time_monitoring': 'Monitoramento em tempo real, métricas e análises',
    'sensor_dashboard': 'Painel de Sensores',
    
    // KPICards
    'average': 'Média',
    'min': 'Mín',
    'max': 'Máx',
    'count': 'Quantidade',
    'no_data_available': 'Nenhum dado disponível',
    'no_chart_data_available': 'Nenhum dado de gráfico disponível',
    
    // Sidebar
    'sidebar_title': 'Painel',
    'controls_filters': 'Controles e Filtros',
    'real_time_update': 'Atualização em Tempo Real',
    'manual_update': 'Atualização Manual',
    'interval': 'Intervalo',
    'last_update': 'Última atualização',
    'smart_mode': 'Modo inteligente: Carrega apenas quando há novos dados',
    'sensor_type': 'Tipo de Sensor',
    'date_range_filter': 'Filtro de Intervalo de Datas',
    'records_limit': 'Limite de Registros',
    'showing': 'Mostrando',
    'records_max': 'registros máx',
    'display_limit': 'Limite de Exibição',
    'records': 'registros',
    'limit_info': 'Isso limita a exibição de registros. O filtro de datas acima recuperará todos os registros correspondentes primeiro.',
    'available_data': 'Dados disponíveis',
    'start_date': 'Data de Início',
    'end_date': 'Data de Término',
    'selected': 'Selecionado',
    'apply_filter': 'Aplicar Filtro',
    'reset_range': 'Redefinir Intervalo',
    'loading_date_ranges': 'Carregando intervalos de datas...',
    'no_data_available_for': 'Nenhum dado disponível para',
    'no_date_range_found': 'Nenhum intervalo de datas encontrado. Tente gerar ou fazer upload de dados primeiro.',
    'please_select_dates': 'Por favor, selecione as datas de início e término',
    'invalid_date_range': 'A data de início deve ser anterior ou igual à data de término',
    
    // Sensor Types
    'air_quality': 'Qualidade do Ar',
    'sound_level': 'Nível de Som',
    'water_level': 'Nível de Água',
    'co2_temperature_humidity': 'CO2, Temperatura, Umidade',
    'decibels': 'Decibéis (dB)',
    'underground_level': 'Nível Subterrâneo',
    
    // Action Buttons
    'refresh': 'Atualizar',
    'generate': 'Gerar',
    'clear': 'Limpar',
    'generate_test_data': 'Gerar Dados de Teste',
    'select_records': 'Selecione o número de registros a gerar. Você os revisará antes de salvá-los no banco de dados.',
    'number_of_records': 'Número de Registros',
    'slide_to_select': 'Deslize para selecionar 10-500 registros',
    'specify_date_range': 'Especificar intervalo de datas',
    'start_date_label': 'Data de Início',
    'end_date_label': 'Data de Término',
    'date_range_hint': 'Se você não especificar datas, os últimos 30 dias serão usados',
    'generating': 'Gerando...',
    'generate_preview': 'Gerar e Visualizar',
    'cancel': 'Cancelar',
    
    // File Upload
    'drag_csv_here': 'Arraste um arquivo CSV aqui ou',
    'select_file': 'Selecionar arquivo',
    'csv_files_only': 'Apenas arquivos CSV (.csv)',
    'uploading_file': 'Enviando arquivo...',
    'upload_csv_only': 'Por favor, envie apenas arquivos CSV',
    'select_csv_file': 'Por favor, selecione um arquivo CSV',
    'upload_error': 'Erro ao enviar arquivo. Por favor, tente novamente.',
    'records_imported': 'registros importados com sucesso',
    'records_saved': 'registros salvos com sucesso',
    'delete_all_data': 'Excluir todos os',
    'sensor_data_question': 'dados do sensor?',
    
    // Common
    'loading': 'Carregando...',
    'error': 'Erro',
    'success': 'Sucesso',
    'on': 'ON',
    'off': 'OFF',
  },
  qu: { // Quechua
    // Header
    'dashboard': 'GAMC Pantalla',
    'big_data_analytics': 'Hatun Willakuy Analisis',
    'logout': 'Lluqsiy',
    'administrator': '👨‍💼 Kamachiy',
    'operator': '👨‍🔧 Ruraq',
    'viewer': '👁️ Qhaway',
    
    // Dashboard
    'monitoring': 'Qhaway',
    'ml_predictions': 'ML Yuyay',
    'health_alerts': 'Qhali & Willakuy',
    'real_time_monitoring': 'Chiqap qhaway, yupaykuna & analisis',
    'sensor_dashboard': 'Sensor Pantalla',
    
    // KPICards
    'average': 'Chawpi',
    'min': 'Uchuy',
    'max': 'Hatun',
    'count': 'Yupay',
    'no_data_available': 'Mana willakuy kanchu',
    'no_chart_data_available': 'Mana grafico willakuy kanchu',
    
    // Sidebar
    'sidebar_title': 'Pantalla',
    'controls_filters': 'Kamachiy & Suyay',
    'real_time_update': 'Chiqap T\'ikray',
    'manual_update': 'Maki T\'ikray',
    'interval': 'Chawpi',
    'last_update': 'Qhipa t\'ikray',
    'smart_mode': 'Yachay modo: Musuq willakuy kan kaptinlla chaskiy',
    'sensor_type': 'Sensor Rikch\'ay',
    'date_range_filter': 'Pacha Suyay Suyay',
    'records_limit': 'Willakuy Tuku',
    'showing': 'Rikch\'akuy',
    'records_max': 'willakuy tuku',
    'display_limit': 'Rikch\'akuy Tuku',
    'records': 'willakuy',
    'limit_info': 'Kayqa willakuy rikch\'akuytam tuku. Pacha suyay qhawanaqa tukuy kikinchay willakuykunatam ñawpaqta chaskiyqa.',
    'available_data': 'Kan willakuy',
    'start_date': 'Qallariy Pacha',
    'end_date': 'Tukuq Pacha',
    'selected': 'Akllasqa',
    'apply_filter': 'Suyayta Churakuy',
    'reset_range': 'Suyayta Kutichiy',
    'loading_date_ranges': 'Pacha suyaykunata chaskiy...',
    'no_data_available_for': 'Mana willakuy kanchu',
    'no_date_range_found': 'Mana pacha suyay tarikunchu. Ñawpaqta willakuyta kamariy o chaskiyta ruray.',
    'please_select_dates': 'Ama hina kaspa qallariywan tukuq pachatam akllay',
    'invalid_date_range': 'Qallariy pachaqa tukuq pachamanta ñawpaq kanan o hina kanan',
    
    // Sensor Types
    'air_quality': 'Wayra Allin',
    'sound_level': 'Uyariy Tuku',
    'water_level': 'Yaku Tuku',
    'co2_temperature_humidity': 'CO2, Q\'uñi, Phuyu',
    'decibels': 'Decibeles (dB)',
    'underground_level': 'Uray Tuku',
    
    // Action Buttons
    'refresh': 'T\'ikray',
    'generate': 'Kamariy',
    'clear': 'Pichay',
    'generate_test_data': 'Prueba Willakuyta Kamariy',
    'select_records': 'Kamariyta munaq willakuy yupayta akllay. Base de datosman churakayta ñawpaqta qhawayqa.',
    'number_of_records': 'Willakuy Yupay',
    'slide_to_select': 'Astay 10-500 willakuykunata akllanapaq',
    'specify_date_range': 'Pacha suyayta sut\'ichay',
    'start_date_label': 'Qallariy Pacha',
    'end_date_label': 'Tukuq Pacha',
    'date_range_hint': 'Pacha mana sut\'ichaptin, qhipa 30 p\'unchawkunatam llamk\'achiyqa',
    'generating': 'Kamariy...',
    'generate_preview': 'Kamariy & Ñawpaq Qhaway',
    'cancel': 'Sayay',
    
    // File Upload
    'drag_csv_here': 'CSV archivotam kayman astay o',
    'select_file': 'Archivota akllay',
    'csv_files_only': 'CSV archivokunallam (.csv)',
    'uploading_file': 'Archivota chaskiy...',
    'upload_csv_only': 'Ama hina kaspa CSV archivokunallatam chaskiy',
    'select_csv_file': 'Ama hina kaspa CSV archivota akllay',
    'upload_error': 'Archivo chaskiy pantay. Musuqmantam ruray.',
    'records_imported': 'willakuy allinta chaskisqa',
    'records_saved': 'willakuy allinta waqaychasqa',
    'delete_all_data': 'Tukuy',
    'sensor_data_question': 'sensor willakuykunata pichay?',
    
    // Common
    'loading': 'Chaskiy...',
    'error': 'Pantay',
    'success': 'Allin',
    'on': 'ON',
    'off': 'OFF',
  },
  ay: { // Aymara
    // Header
    'dashboard': 'GAMC Pantalla',
    'big_data_analytics': 'Jach\'a Yatiy Analisis',
    'logout': 'Lurata',
    'administrator': '👨‍💼 Jiliri',
    'operator': '👨‍🔧 Luraña',
    'viewer': '👁️ Uñt\'ayaña',
    
    // Dashboard
    'monitoring': 'Uñt\'ayaña',
    'ml_predictions': 'ML Yatiy',
    'health_alerts': 'Qamasa & Yatiy',
    'real_time_monitoring': 'Chiqa uñt\'ayaña, yapxata & analisis',
    'sensor_dashboard': 'Sensor Pantalla',
    
    // KPICards
    'average': 'Chika',
    'min': 'Juk\'a',
    'max': 'Jach\'a',
    'count': 'Yapxata',
    'no_data_available': 'Janiw yatiy utjkiti',
    'no_chart_data_available': 'Janiw grafico yatiy utjkiti',
    
    // Sidebar
    'sidebar_title': 'Pantalla',
    'controls_filters': 'Kamachiy & Suyay',
    'real_time_update': 'Chiqa T\'ikray',
    'manual_update': 'Ampar T\'ikray',
    'interval': 'Chika',
    'last_update': 'Qhipa t\'ikray',
    'smart_mode': 'Yatiy modo: Musuq yatiy utjkiti kuna chaskiy',
    'sensor_type': 'Sensor Rikch\'ay',
    'date_range_filter': 'Pacha Suyay Suyay',
    'records_limit': 'Yatiy Tuku',
    'showing': 'Uñt\'ayaña',
    'records_max': 'yatiy tuku',
    'display_limit': 'Uñt\'ayaña Tuku',
    'records': 'yatiy',
    'limit_info': 'Aka yatiy uñt\'ayañat tuku. Pacha suyay qhawanaqa tukuy kikinchay yatiykunatam ñawpaqta chaskiyqa.',
    'available_data': 'Utj yatiy',
    'start_date': 'Qallariy Pacha',
    'end_date': 'Tukuq Pacha',
    'selected': 'Akllata',
    'apply_filter': 'Suyayta Churakuy',
    'reset_range': 'Suyayta Kutichiy',
    'loading_date_ranges': 'Pacha suyaykunata chaskiy...',
    'no_data_available_for': 'Janiw yatiy utjkiti',
    'no_date_range_found': 'Janiw pacha suyay utjkiti. Ñawpaqta yatiyta kamariy o chaskiyta ruray.',
    'please_select_dates': 'Ama hina kaspa qallariywan tukuq pachatam akllay',
    'invalid_date_range': 'Qallariy pachaqa tukuq pachamanta ñawpaq kanan o hina kanan',
    
    // Sensor Types
    'air_quality': 'Wayra Allin',
    'sound_level': 'Uyariy Tuku',
    'water_level': 'Uma Tuku',
    'co2_temperature_humidity': 'CO2, Q\'uñi, Phuyu',
    'decibels': 'Decibeles (dB)',
    'underground_level': 'Uray Tuku',
    
    // Action Buttons
    'refresh': 'T\'ikray',
    'generate': 'Kamariy',
    'clear': 'Pichay',
    'generate_test_data': 'Prueba Yatiyta Kamariy',
    'select_records': 'Kamariyta munaq yatiy yapxatata akllay. Base de datosman churakayta ñawpaqta uñt\'ayañaqa.',
    'number_of_records': 'Yatiy Yapxata',
    'slide_to_select': 'Astay 10-500 yatiykunata akllanapaq',
    'specify_date_range': 'Pacha suyayta sut\'ichay',
    'start_date_label': 'Qallariy Pacha',
    'end_date_label': 'Tukuq Pacha',
    'date_range_hint': 'Pacha mana sut\'ichaptin, qhipa 30 urukunatam llamk\'achiyqa',
    'generating': 'Kamariy...',
    'generate_preview': 'Kamariy & Ñawpaq Uñt\'ayaña',
    'cancel': 'Sayay',
    
    // File Upload
    'drag_csv_here': 'CSV archivotam kayman astay o',
    'select_file': 'Archivota akllay',
    'csv_files_only': 'CSV archivokunallam (.csv)',
    'uploading_file': 'Archivota chaskiy...',
    'upload_csv_only': 'Ama hina kaspa CSV archivokunallatam chaskiy',
    'select_csv_file': 'Ama hina kaspa CSV archivota akllay',
    'upload_error': 'Archivo chaskiy pantja. Musuqmantam ruray.',
    'records_imported': 'yatiy allinta chaskisqa',
    'records_saved': 'yatiy allinta waqaychasqa',
    'delete_all_data': 'Tukuy',
    'sensor_data_question': 'sensor yatiykunata pichay?',
    
    // Common
    'loading': 'Chuymaña...',
    'error': 'Pantja',
    'success': 'Suma',
    'on': 'ON',
    'off': 'OFF',
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('app_language') || 'es';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}





